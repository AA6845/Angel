// 📦 Imports
const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const { parse } = require('csv-parse');
const path = require('path');
require('dotenv').config();

// 🔐 Session-Handling (einfach)
const session = require('express-session');

// 📁 App & Konfiguration
const app = express();
const port = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USERS_FILE = path.join(__dirname, 'users.json');
const promptPath = path.join(__dirname, 'prompts', 'masterprompt.txt');
const systemPrompt = fs.readFileSync(promptPath, 'utf-8');

// 🔐 Middleware – REIHENFOLGE IST WICHTIG
app.use(express.json()); // Muss VOR den Routen kommen
app.use(express.static('public'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'geheim',
  resave: false,
  saveUninitialized: true
}));

// 🔌 MongoDB Verbindung
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/angel_adviser')
  .then(() => console.log("✅ MongoDB verbunden"))
  .catch(err => console.error("❌ MongoDB Fehler:", err));

mongoose.connection.on('error', err => console.error("❌ MongoDB Fehler:", err));

// 📦 Routen einbinden
const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

// ✅ Session-basierten Loginstatus abfragen
app.get('/api/me', (req, res) => {
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: "Nicht eingeloggt." });
  }
});


// 📥 CSV-Upload mit AES-Verschlüsselung
const upload = multer({ dest: 'uploads/' });

app.post('/upload-csv', upload.single('csvfile'), (req, res) => {
  //if (!req.session.username) {
   // return res.status(401).json({ error: "Nicht eingeloggt." });
 // }

  const filePath = req.file.path;
  const username = req.session.username;
  const records = [];

  fs.createReadStream(filePath)
    .pipe(parse({ columns: true, skip_empty_lines: true }))
    .on('data', (row) => {
      const recordId = row.ID;
      delete row.ID;

      const encryptedRow = {};
      for (const [key, value] of Object.entries(row)) {
        encryptedRow[key] = encrypt(value);
      }

      records.push({ user: username, recordId, encryptedData: encryptedRow });
    })
    .on('end', async () => {
      fs.unlinkSync(filePath);
      try {
        const result = await EncryptedRecord.insertMany(records);
        res.json({ inserted: result.length });
      } catch (err) {
        console.error("❌ MongoDB Insert Error:", err);
        res.status(500).json({ error: "Fehler beim Speichern" });
      }
    })
    .on('error', (err) => {
      res.status(500).json({ error: "CSV konnte nicht gelesen werden" });
    });
});

// 🔍 Datensatz per ID abrufen & entschlüsseln
app.get('/api/schuldner/:id', async (req, res) => {
  const username = req.session.username;
  const recordId = req.params.id;

  const record = await EncryptedRecord.findOne({ user: username, recordId });
  if (!record) return res.status(404).json({ error: "Nicht gefunden" });

  const decrypted = {};
  for (const [key, value] of Object.entries(record.encryptedData)) {
    decrypted[key] = decrypt(value);
  }

  res.json({ id: recordId, data: decrypted });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { userInput, schuldner = {}, history = [] } = req.body;

    // 🔒 Sicherheitsprüfung auf korrekte Struktur
    if (typeof schuldner !== 'object' || schuldner === null || Array.isArray(schuldner)) {
      return res.status(400).json({ error: "Ungültiges Schuldnerobjekt" });
    }

    // 🔐 DSGVO-konforme Filterung: sensible Felder pseudonymisieren
    const sensibleFelder = ["NAME_SCHULDNER", "ADRESSE", "GEBURTSDATUM", "GEBURTSORT"];
    
    console.log("🧪 Typ von schuldner:", typeof schuldner);
    console.log("🧪 Inhalt von schuldner:", schuldner);


    const schuldnerSafe = Object.fromEntries(
      Object.entries(schuldner).map(([key, value]) =>
        sensibleFelder.includes(key) ? [key, `[${key}]`] : [key, value]
      )
    );
    

    // 🧠 Optional: zusätzliche Absicherung
    if (typeof schuldnerSafe !== 'object' || schuldnerSafe === null) {
      console.error("❌ schuldnerSafe ist kein valides Objekt:", schuldnerSafe);
      return res.status(500).json({ error: "Interner Fehler bei Schuldnerdaten" });
    }

    // 🧠 Eingabe ggf. anreichern
    let enrichedInput = userInput;
    const lower = userInput.toLowerCase();
    if (["weiter", "ok", "passt", "verstehe"].some(k => lower.includes(k))) {
      enrichedInput = "[USER_ACK] Nutzer stimmt zu – bitte mit der aktuellen Phase fortfahren.\n" + userInput;
    } else if (lower.includes("phase 2")) {
      enrichedInput = "[PHASE_SWITCH] Bitte beginne Phase 2.\n" + userInput;
    }

    // 📜 Systemprompt mit echten Daten (wird nicht an GPT gesendet)
    const resolvedSystemPrompt = systemPrompt.replace(/\{\{(.*?)\}\}/g, (_, key) =>
      schuldner[key.trim()] || `[${key.trim()}]`
    );

    // 💬 Chatverlauf mit anonymisierten Schuldnerdaten
    const chatHistory = [
      { role: "system", content: resolvedSystemPrompt },
      {
        role: "user",
        content: `📂 Schuldnerdaten:\n` +
          Object.entries(schuldnerSafe)
            .map(([k, v]) => `- ${k}: ${v}`)
            .join('\n')
      },
      ...history,
      { role: "user", content: enrichedInput }
    ];

    // 🛠️ Debug-Log zur Kontrolle
    console.log("🧠 Prompt an OpenAI:", JSON.stringify(chatHistory, null, 2));

    // 📡 Anfrage an OpenAI
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: "gpt-4-1106-preview",
        messages: chatHistory,
        temperature: 0.4
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 🧾 Antwort empfangen & Platzhalter durch echte Daten ersetzen
    const reply = response.data.choices?.[0]?.message?.content || "⚠️ Keine Antwort erhalten.";
    const finalReply = reply.replace(/\[(.*?)\]/g, (_, key) =>
      schuldner[key.trim()] || `<${key.trim()}>`
    );

    res.json({ reply: finalReply });
  } catch (error) {
    console.error("❌ Fehler bei Chat:", error.response?.data || error.message);
    res.status(500).json({ error: error.message || "Unbekannter Fehler" });
  }
});



const { marked } = require('marked');
const { htmlToText } = require('html-to-text'); // für echte Textumwandlung
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const stream = require('stream');

app.post('/send-email', async (req, res) => {
  const { email, content } = req.body;

  if (!email || !content) {
    return res.status(400).json({ error: "E-Mail und Gesprächsinhalte erforderlich." });
  }

  // 1. 🧾 Markdown → HTML → Klartext
  const html = marked.parse(content);
  const plainText = htmlToText(html, {
    wordwrap: 120,
    selectors: [{ selector: 'a', options: { hideLinkHrefIfSameAsText: true } }]
  });

  // 2. 📄 PDF erzeugen
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  let buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', async () => {
    const pdfData = Buffer.concat(buffers);

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS
        }
      });

      await transporter.sendMail({
        from: `"Angel Adviser" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Gesprächsprotokoll",
        text: "Im Anhang findest du das Gesprächsprotokoll als PDF.",
        attachments: [{
          filename: 'gespraechsprotokoll.pdf',
          content: pdfData
        }]
      });

      res.json({ success: true });
    } catch (err) {
      console.error("❌ Fehler beim E-Mail-Versand:", err);
      res.status(500).json({ error: "E-Mail konnte nicht gesendet werden." });
    }
  });

  // 🖨️ PDF-Inhalt schreiben
  doc.font('Helvetica');
  doc.fontSize(16).text("🧾 Gesprächsprotokoll", { align: 'center' });
  doc.moveDown();

  doc.fontSize(12).text("Zusammenfassung", { underline: true });
  doc.moveDown(0.5);

  doc.fontSize(11).text(plainText, {
    align: 'left',
    lineGap: 4
  });

  doc.moveDown();
  doc.fontSize(10).fillColor('gray').text(`Erstellt am: ${new Date().toLocaleString()}`);
  doc.end();
});


const generatePDF = require('./pdfExport'); // ggf. Pfad anpassen


app.use(express.json()); // falls noch nicht vorhanden

app.post('/generate-pdf', async (req, res) => {
  const { username, summaryText, debtorData } = req.body;

  const outputPath = path.join(__dirname, 'tmp', `pdf-${Date.now()}.pdf`);
  const logoPath = path.join(__dirname, 'assets', 'logo.png'); // optional

  try {
    await generatePDF({ username, summaryText, debtorData, outputPath, logoPath });
    res.download(outputPath, 'Gesprächszusammenfassung.pdf', err => {
      if (!err) fs.unlinkSync(outputPath); // aufräumen
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Fehler beim Erstellen der PDF');
  }
});




app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ error: "Logout fehlgeschlagen." });
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});


// 🚀 Start
app.listen(port, () => {
  console.log(`✅ Server läuft auf http://localhost:${port}`);
});

const publicPath = path.join(__dirname, 'public/landingpage');

app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});
