// 📦 routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { encrypt } = require('../encryption');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// ✅ Registrierung mit Mailversand
router.post('/register', async (req, res) => {
  console.log("📩 Register-Route erreicht.");
  console.log("📦 Payload:", req.body);

  try {
    const { username, password, email, promoCode } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt sein.' });
    }

    const existing = await User.findOne({ username });
    if (existing) return res.status(400).json({ error: 'Benutzer existiert bereits.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const emailEncrypted = encrypt(email);
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const testUntil = promoCode === 'TRIAL14' ? new Date(Date.now() + 14 * 86400000) : null;

    const newUser = new User({
      username,
      passwordHash,
      emailEncrypted,
      promoCode,
      verificationCode,
      testUntil
    });

    await newUser.save();
    console.log("✅ Benutzer gespeichert:", username);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    const html = `
      <h2 style="color:#003366">Angel Adviser – Registrierung</h2>
      <p>Hallo ${username},</p>
      <p>Bitte gib folgenden Code in der App ein, um deine Registrierung zu bestätigen:</p>
      <h1>${verificationCode}</h1>
    `;

    await transporter.sendMail({
      from: `"Angel Adviser" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Registrierung bestätigen',
      html
    });

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Fehler bei Registrierung:", err);
    res.status(500).json({ error: "Interner Fehler bei der Registrierung." });
  }
});

// ✅ Codeverifizierung
router.post('/verify', async (req, res) => {
  try {
    const { username, code } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
    if (user.isVerified) return res.json({ success: true });

    if (user.verificationCode === code) {
      user.isVerified = true;
      await user.save();
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Code ungültig.' });
  } catch (err) {
    console.error("❌ Fehler bei Verifizierung:", err);
    res.status(500).json({ error: "Interner Fehler bei der Verifizierung." });
  }
});

// ✅ Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(401).json({ error: 'Benutzer nicht gefunden.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Falsches Passwort.' });

    if (!user.isVerified) return res.status(403).json({ error: 'Bitte bestätige deine E-Mail zuerst.' });

    req.session.username = username;
    res.json({ success: true, username });
  } catch (err) {
    console.error("❌ Fehler beim Login:", err);
    res.status(500).json({ error: "Interner Fehler beim Login." });
  }
});

module.exports = router;
