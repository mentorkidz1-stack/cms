const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const GOLD = '#B8952E';
const NAVY = '#1B2A4A';
const IVORY = '#FAF8F5';

function resolveUploadPath(url) {
  if (!url) return null;
  const filePath = path.join(__dirname, '..', '..', 'public', url.replace(/^\//, ''));
  return fs.existsSync(filePath) ? filePath : null;
}

function drawHeader(doc, settings, x, y, width) {
  const logoPath = resolveUploadPath(settings.logoUrl);
  if (logoPath) {
    try {
      doc.image(logoPath, x, y, { fit: [90, 60] });
      return;
    } catch (err) {
      // fall through to text fallback
    }
  }
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#212427').text(settings.siteName, x, y);
}

// Le séparateur de milliers "fr-FR" (espace fine insécable U+202F) n'existe pas
// dans l'encodage WinAnsi des polices standard de PDFKit et s'affiche comme un
// glyphe erroné ("/") — on le remplace par un espace normal, lisible partout.
function formatFCFA(amount) {
  return amount.toLocaleString('fr-FR').replace(/[  ]/g, ' ');
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function resolveSignatory(settings, signatory) {
  return signatory || { fullName: 'Le Fondateur', title: settings.siteName, signatureUrl: null, stampUrl: null };
}

// Nom + titre du signataire sous le trait de signature. Un nom long peut
// passer sur deux lignes : on mesure sa hauteur réelle (heightOfString)
// pour placer le titre juste en dessous au lieu d'un décalage fixe qui les
// ferait se chevaucher.
function drawSignatureName(doc, signer, x, y, width) {
  const nameFontSize = signer.fullName.length > 26 ? 8 : 9;
  doc.font('Helvetica-Bold').fontSize(nameFontSize);
  const nameHeight = doc.heightOfString(signer.fullName, { width, align: 'center' });
  doc.fillColor('#333333').text(signer.fullName, x, y, { width, align: 'center' });

  doc.font('Helvetica').fontSize(8).fillColor('#888888')
    .text(signer.title, x, y + nameHeight + 2, { width, align: 'center' });
}

function generateReceiptPdf(res, receipt, settings, signatory) {
  const signer = resolveSignatory(settings, signatory);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${receipt.receiptNumber}.pdf"`);
  doc.pipe(res);

  drawHeader(doc, settings, 50, 50, 200);

  doc.fontSize(10).font('Helvetica').fillColor('#666666')
    .text(settings.contactEmail || '', 300, 50, { width: 245, align: 'right' })
    .text(settings.whatsappNumber ? `WhatsApp : ${settings.whatsappNumber}` : '', 300, 65, { width: 245, align: 'right' });

  doc.moveDown(4);
  doc.fillColor('#212427').fontSize(22).font('Helvetica-Bold').text('REÇU DE PAIEMENT', 50, 140);
  doc.fontSize(11).font('Helvetica').fillColor('#666666')
    .text(`N° ${receipt.receiptNumber}`, 50, 172)
    .text(`Date : ${formatDate(receipt.paymentDate)}`, 50, 188);

  doc.moveTo(50, 220).lineTo(545, 220).strokeColor('#eeeeee').stroke();

  doc.fillColor('#212427').fontSize(12).font('Helvetica-Bold').text('Client', 50, 240);
  doc.font('Helvetica').fontSize(11).fillColor('#333333')
    .text(receipt.clientName, 50, 258)
    .text(receipt.clientPhone || '', 50, 274);

  const tableTop = 320;
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#212427')
    .text('Description', 50, tableTop)
    .text('Montant', 420, tableTop, { width: 125, align: 'right' });
  doc.moveTo(50, tableTop + 20).lineTo(545, tableTop + 20).strokeColor('#212427').stroke();

  doc.font('Helvetica').fontSize(11).fillColor('#333333')
    .text(receipt.itemLabel, 50, tableTop + 32, { width: 350 })
    .text(`${formatFCFA(receipt.amount)} FCFA`, 420, tableTop + 32, { width: 125, align: 'right' });

  doc.moveTo(50, tableTop + 70).lineTo(545, tableTop + 70).strokeColor('#eeeeee').stroke();

  doc.font('Helvetica-Bold').fontSize(12)
    .text('Total payé', 300, tableTop + 85, { width: 120, align: 'right' })
    .fillColor(settings.primaryColor || '#356DF1')
    .text(`${formatFCFA(receipt.amount)} FCFA`, 420, tableTop + 85, { width: 125, align: 'right' });

  if (receipt.paymentMethod) {
    doc.fillColor('#666666').font('Helvetica').fontSize(10)
      .text(`Mode de paiement : ${receipt.paymentMethod}`, 50, tableTop + 130);
  }
  if (receipt.notes) {
    doc.fillColor('#666666').font('Helvetica').fontSize(10)
      .text(`Note : ${receipt.notes}`, 50, tableTop + 150, { width: 495 });
  }

  const sigX = 395;
  const sigY = tableTop + 190;
  const signaturePath = resolveUploadPath(signer.signatureUrl);
  if (signaturePath) {
    try {
      doc.image(signaturePath, sigX + 5, sigY - 45, { fit: [120, 40] });
    } catch (err) {
      // ignore, la ligne de signature ci-dessous sert de repli visuel
    }
  }
  doc.moveTo(sigX, sigY).lineTo(sigX + 150, sigY).lineWidth(0.75).strokeColor('#999999').stroke();
  drawSignatureName(doc, signer, sigX, sigY + 6, 150);

  doc.fontSize(9).fillColor('#999999')
    .text(`Merci pour votre confiance — ${settings.siteName}`, 50, 750, { width: 495, align: 'center' });

  doc.end();
}

function drawSeal(doc, cx, cy) {
  doc.save();
  doc.circle(cx, cy, 34).lineWidth(1.5).strokeColor(GOLD).stroke();
  doc.circle(cx, cy, 29).lineWidth(0.75).strokeColor(GOLD).stroke();
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GOLD)
    .text('OFFICIEL', cx - 30, cy - 12, { width: 60, align: 'center', characterSpacing: 0.5 });
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(GOLD)
    .text('CERTIFIÉ', cx - 30, cy + 4, { width: 60, align: 'center', characterSpacing: 0.5 });
  doc.restore();
}

function drawCornerAccents(doc, left, top, right, bottom) {
  const len = 14;
  doc.save().lineWidth(1.5).strokeColor(GOLD);
  // top-left
  doc.moveTo(left, top + len).lineTo(left, top).lineTo(left + len, top).stroke();
  // top-right
  doc.moveTo(right - len, top).lineTo(right, top).lineTo(right, top + len).stroke();
  // bottom-left
  doc.moveTo(left, bottom - len).lineTo(left, bottom).lineTo(left + len, bottom).stroke();
  // bottom-right
  doc.moveTo(right - len, bottom).lineTo(right, bottom).lineTo(right, bottom - len).stroke();
  doc.restore();
}

async function generateCertificatePdf(res, certificate, settings, signatory, verifyUrl) {
  const signer = resolveSignatory(settings, signatory);
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 0 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${certificate.certificateNumber}.pdf"`);
  doc.pipe(res);

  const { width, height } = doc.page;
  const cx = width / 2;

  // Fond ivoire + double bordure élégante (filet or / bleu nuit)
  doc.rect(0, 0, width, height).fill(IVORY);
  doc.rect(24, 24, width - 48, height - 48).lineWidth(2).strokeColor(GOLD).stroke();
  doc.rect(34, 34, width - 68, height - 68).lineWidth(0.75).strokeColor(NAVY).stroke();
  drawCornerAccents(doc, 34, 34, width - 34, height - 34);

  // Logo centré en haut
  const logoPath = resolveUploadPath(settings.logoUrl);
  if (logoPath) {
    try {
      doc.image(logoPath, cx - 45, 52, { fit: [90, 55] });
    } catch (err) {
      doc.fontSize(18).font('Helvetica-Bold').fillColor(NAVY).text(settings.siteName, 0, 62, { align: 'center' });
    }
  } else {
    doc.fontSize(18).font('Helvetica-Bold').fillColor(NAVY).text(settings.siteName, 0, 62, { align: 'center' });
  }

  // Titre solennel
  doc.fillColor(NAVY).fontSize(26).font('Times-Bold')
    .text('ATTESTATION DE FORMATION', 0, 128, { align: 'center', characterSpacing: 2 });

  doc.moveTo(cx - 70, 162).lineTo(cx + 70, 162).lineWidth(1).strokeColor(GOLD).stroke();

  doc.fillColor('#555555').fontSize(13).font('Times-Italic')
    .text('Ce certificat est décerné à', 0, 178, { align: 'center' });

  doc.fillColor(GOLD).fontSize(34).font('Times-Bold')
    .text(certificate.studentName, 60, 205, { align: 'center', width: width - 120 });

  doc.fillColor('#333333').fontSize(13).font('Times-Roman')
    .text('pour avoir suivi avec succès la formation', 0, 260, { align: 'center' });

  doc.fillColor(NAVY).fontSize(19).font('Times-Bold')
    .text(certificate.formationTitle, 100, 285, { align: 'center', width: width - 200 });

  doc.fillColor('#666666').fontSize(11).font('Times-Roman')
    .text(`Délivré le ${formatDate(certificate.completionDate)}`, 0, 335, { align: 'center' });

  // ----- Bas de page : QR code (gauche) / sceau (centre) / signature (droite) -----
  const bottomY = height - 130;

  if (verifyUrl) {
    try {
      const qrBuffer = await QRCode.toBuffer(verifyUrl, {
        type: 'png',
        margin: 1,
        width: 260,
        color: { dark: NAVY, light: '#FAF8F500' },
      });
      doc.image(qrBuffer, 60, bottomY, { width: 68, height: 68 });
      doc.fontSize(7).font('Helvetica').fillColor('#888888')
        .text('Scanner pour vérifier', 45, bottomY + 72, { width: 100, align: 'center' });
    } catch (err) {
      // si la génération du QR échoue, on continue sans bloquer le PDF
    }
  }
  doc.fontSize(9).font('Helvetica-Bold').fillColor(NAVY)
    .text(certificate.certificateNumber, 45, bottomY + 84, { width: 100, align: 'center' });

  const stampPath = resolveUploadPath(signer.stampUrl);
  if (stampPath) {
    try {
      doc.image(stampPath, cx - 34, bottomY + 1, { fit: [68, 68] });
    } catch (err) {
      drawSeal(doc, cx, bottomY + 35);
    }
  } else {
    drawSeal(doc, cx, bottomY + 35);
  }

  const sigX = width - 200;
  const signaturePath = resolveUploadPath(signer.signatureUrl);
  if (signaturePath) {
    try {
      doc.image(signaturePath, sigX + 10, bottomY - 10, { fit: [120, 45] });
    } catch (err) {
      // ignore, la ligne de signature ci-dessous sert de repli visuel
    }
  }
  doc.moveTo(sigX, bottomY + 40).lineTo(sigX + 140, bottomY + 40).lineWidth(0.75).strokeColor('#999999').stroke();
  drawSignatureName(doc, signer, sigX, bottomY + 46, 140);

  doc.end();
}

module.exports = { generateReceiptPdf, generateCertificatePdf };
