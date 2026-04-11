/**
 * lib/generatePdf.js
 *
 * Builds a PDF for a parts request using pdf-lib.
 * Returns a Uint8Array (raw PDF bytes) that can be sent as an email attachment.
 *
 * To change the layout or add company branding, edit this file.
 */

const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');

/**
 * @param {Object} fields  - Form field values (strings)
 * @param {Array}  photos  - Array of { filename, buffer } objects for uploaded photos
 * @returns {Promise<Uint8Array>} PDF bytes
 */
async function generatePdf(fields, photos = []) {
  const pdfDoc = await PDFDocument.create();
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Page setup ──────────────────────────────────────────────────────────────
  const page = pdfDoc.addPage([612, 792]); // US Letter
  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // ── Helper functions ─────────────────────────────────────────────────────────

  /** Draw a full-width section header bar */
  function sectionHeader(label) {
    y -= 18;
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: width - margin * 2,
      height: 18,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(label, {
      x: margin + 4,
      y: y,
      size: 10,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });
    y -= 6;
  }

  /** Draw a labelled field row */
  function field(label, value, opts = {}) {
    const rowHeight = opts.rowHeight || 20;
    y -= rowHeight;
    page.drawText(`${label}:`, {
      x: margin,
      y,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(String(value || '—'), {
      x: margin + 160,
      y,
      size: 9,
      font: helvetica,
      color: rgb(0, 0, 0),
    });
    // Light underline
    page.drawLine({
      start: { x: margin + 158, y: y - 2 },
      end: { x: width - margin, y: y - 2 },
      thickness: 0.4,
      color: rgb(0.7, 0.7, 0.7),
    });
  }

  // ── Title ────────────────────────────────────────────────────────────────────
  page.drawText('AFG Part Procurement Request', {
    x: margin,
    y,
    size: 16,
    font: helveticaBold,
    color: rgb(0, 0, 0),
  });
  y -= 6;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0, 0, 0),
  });

  // ── General Information ──────────────────────────────────────────────────────
  sectionHeader('General Information');
  field('Date', fields.date);
  field('Technician', fields.technician);
  field('Training Center', fields.trainingCenter);
  field('Simulator', fields.simulator);
  field('Priority', fields.priority);
  field('Discrepancy Number', fields.discrepancyNumber);

  // ── Part Information ─────────────────────────────────────────────────────────
  sectionHeader('Part Information');
  field('Part Number', fields.partNumber);
  field('Part Description', fields.partDescription);
  field('Quantity', fields.quantity);
  field('Reason', fields.reason);

  // ── Repairable Part Information ───────────────────────────────────────────────
  sectionHeader('Repairable Part Information');
  field('Repairable Part Number', fields.repairablePartNumber);
  field('Repairable Part Description', fields.repairablePartDescription);
  field('Repairable Serial Number', fields.repairableSerialNumber);

  // ── Approval Lines ────────────────────────────────────────────────────────────
  sectionHeader('Approvals');
  y -= 14;
  const approvals = [
    'Manager / Assistant of Simulator Maintenance',
    'Director of Technical Operations ($5,000 and above)',
    'Vice President of Technical Operations ($50,000 and above)',
  ];
  approvals.forEach((label) => {
    y -= 28;
    page.drawText(label + ':', {
      x: margin,
      y,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    // Signature line
    page.drawLine({
      start: { x: margin + 250, y },
      end: { x: width - margin - 100, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
    page.drawText('Date:', {
      x: width - margin - 95,
      y,
      size: 9,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    page.drawLine({
      start: { x: width - margin - 60, y },
      end: { x: width - margin, y },
      thickness: 0.5,
      color: rgb(0, 0, 0),
    });
  });

  // ── Photos (embed if present) ─────────────────────────────────────────────────
  if (photos.length > 0) {
    // Add a new page for photos
    const photoPage = pdfDoc.addPage([612, 792]);
    let py = photoPage.getSize().height - margin;

    photoPage.drawText('Attached Photos', {
      x: margin,
      y: py,
      size: 14,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });
    py -= 20;

    for (const photo of photos) {
      if (py < 150) break; // stop if no room left

      try {
        let embeddedImage;
        const lowerName = photo.filename.toLowerCase();

        if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
          embeddedImage = await pdfDoc.embedJpg(photo.buffer);
        } else if (lowerName.endsWith('.png')) {
          embeddedImage = await pdfDoc.embedPng(photo.buffer);
        } else {
          // Skip unsupported formats
          continue;
        }

        // Scale image to fit within the page width
        const maxW = width - margin * 2;
        const maxH = 200;
        const scale = Math.min(maxW / embeddedImage.width, maxH / embeddedImage.height, 1);
        const imgWidth = embeddedImage.width * scale;
        const imgHeight = embeddedImage.height * scale;

        py -= imgHeight + 10;
        photoPage.drawImage(embeddedImage, {
          x: margin,
          y: py,
          width: imgWidth,
          height: imgHeight,
        });

        photoPage.drawText(photo.filename, {
          x: margin,
          y: py - 12,
          size: 8,
          font: helvetica,
          color: rgb(0.4, 0.4, 0.4),
        });
        py -= 24;
      } catch {
        // If embedding fails, skip this photo silently
      }
    }
  }

  return pdfDoc.save();
}

module.exports = { generatePdf };
