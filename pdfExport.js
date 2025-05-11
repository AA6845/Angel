const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function generatePDF({ username, summaryText, debtorData, outputPath, logoPath }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(outputPath);
    doc.pipe(writeStream);

    const mainColor = '#003366';
    const grayText = '#333333';

    // Header
    doc.fillColor(mainColor).font('Helvetica-Bold').fontSize(14)
      .text(`Exportiert von: ${username}`, { continued: true });
    doc.fillColor(grayText).font('Helvetica').fontSize(11)
      .text(`   |   ${new Date().toLocaleString()}`);

    if (logoPath && fs.existsSync(logoPath)) {
      doc.image(logoPath, doc.page.width - 130, 40, { width: 80 });
    }

    doc.moveDown(1.5);
    doc.fontSize(11).fillColor(grayText);
    doc.text(`Schuldner: ${debtorData.name}`);
    doc.text(`Aktenzeichen: ${debtorData.caseNumber}`);
    doc.text(`Forderung: ${debtorData.amount}`);
    doc.text(`Letzter Kontakt: ${debtorData.lastContact}`);
    doc.moveDown();

    doc.strokeColor(mainColor).moveTo(doc.x, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

    doc.fillColor(mainColor).fontSize(16).text("Gesprächszusammenfassung");
    doc.moveDown();
    doc.fillColor('black').font('Helvetica').fontSize(12);
    doc.text(summaryText, {
      align: 'left',
      lineGap: 4
    });

    doc.end();
    writeStream.on('finish', () => resolve(outputPath));
    writeStream.on('error', reject);
  });
}

module.exports = generatePDF;
