/**
 * pages/api/submit.js
 *
 * Handles the parts-request form submission:
 *   1. Parses multipart/form-data (text fields + photo uploads)
 *   2. Generates a PDF using lib/generatePdf.js
 *   3. Emails the PDF (+ photos as attachments) via Resend
 *
 * ── Configuring Recipients ──────────────────────────────────────────────────
 * Set the EMAIL_RECIPIENTS environment variable to a comma-separated list:
 *   EMAIL_RECIPIENTS=manager@company.com,ops@company.com
 *
 * Or hard-code addresses in the HARDCODED_RECIPIENTS array below.
 * ────────────────────────────────────────────────────────────────────────────
 */

import formidable from 'formidable';
import fs from 'fs';
import { generatePdf } from '../../lib/generatePdf';
import { Resend } from 'resend';

// Disable Next.js default body parser so formidable can handle the stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// ── Hard-coded fallback recipients (used if EMAIL_RECIPIENTS is not set) ────
// Edit this array to add/remove recipients without using environment variables.
const HARDCODED_RECIPIENTS = [];

// ── Resend client ────────────────────────────────────────────────────────────
// Set RESEND_API_KEY in your .env.local / Vercel environment variables.
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── 1. Parse the multipart form ────────────────────────────────────────────
  let fields, files;
  try {
    ({ fields, files } = await parseForm(req));
  } catch (err) {
    console.error('Form parse error:', err);
    return res.status(400).json({ error: 'Failed to parse form data.' });
  }

  // formidable returns arrays for each field; unwrap to single values
  const f = (key) => (Array.isArray(fields[key]) ? fields[key][0] : fields[key]) || '';

  const formData = {
    date: f('date'),
    technician: f('technician'),
    trainingCenter: f('trainingCenter'),
    simulator: f('simulator'),
    priority: f('priority'),
    discrepancyNumber: f('discrepancyNumber'),
    partNumber: f('partNumber'),
    partDescription: f('partDescription'),
    quantity: f('quantity'),
    reason: f('reason'),
    repairablePartNumber: f('repairablePartNumber'),
    repairablePartDescription: f('repairablePartDescription'),
    repairableSerialNumber: f('repairableSerialNumber'),
  };

  // ── 2. Read uploaded photo files into memory ───────────────────────────────
  const photoList = [];
  const uploadedFiles = files.photos ? (Array.isArray(files.photos) ? files.photos : [files.photos]) : [];

  for (const file of uploadedFiles) {
    try {
      const buffer = fs.readFileSync(file.filepath);
      photoList.push({ filename: file.originalFilename || 'photo', buffer });
    } catch {
      // If a file can't be read, skip it
    }
  }

  // ── 3. Generate PDF ────────────────────────────────────────────────────────
  let pdfBytes;
  try {
    pdfBytes = await generatePdf(formData, photoList);
  } catch (err) {
    console.error('PDF generation error:', err);
    return res.status(500).json({ error: 'Failed to generate PDF.' });
  }

  // ── 4. Send email ──────────────────────────────────────────────────────────
  const recipients = getRecipients();

  if (recipients.length === 0) {
    // No email configured — still return success so the form works without email setup
    console.warn('No email recipients configured. Skipping email send.');
    return res.status(200).json({ success: true, emailSent: false });
  }

  // Build email attachments: PDF + any uploaded photos
  const attachments = [
    {
      filename: `parts-request-${formData.date || 'undated'}.pdf`,
      content: Buffer.from(pdfBytes).toString('base64'),
    },
  ];

  for (const photo of photoList) {
    attachments.push({
      filename: photo.filename,
      content: photo.buffer.toString('base64'),
    });
  }

  const subject = `Parts Request — ${formData.simulator || 'Unknown Simulator'} — ${formData.date || 'No Date'}`;

  const htmlBody = buildEmailHtml(formData);

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Parts Request <onboarding@resend.dev>',
      to: recipients,
      subject,
      html: htmlBody,
      attachments,
    });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Form received but email failed to send.' });
  }

  return res.status(200).json({ success: true, emailSent: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Parse the incoming request with formidable */
function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: true,   // allow multiple file uploads
      maxFileSize: 10 * 1024 * 1024, // 10 MB per file
    });
    form.parse(req, (err, fields, files) => {
      if (err) return reject(err);
      resolve({ fields, files });
    });
  });
}

/** Resolve the list of recipient email addresses */
function getRecipients() {
  if (process.env.EMAIL_RECIPIENTS) {
    return process.env.EMAIL_RECIPIENTS.split(',').map((e) => e.trim()).filter(Boolean);
  }
  return HARDCODED_RECIPIENTS;
}

/** Build a simple HTML email body summarising the form fields */
function buildEmailHtml(f) {
  const row = (label, value) =>
    `<tr><td style="font-weight:bold;padding:4px 8px;width:220px">${label}</td><td style="padding:4px 8px">${value || '—'}</td></tr>`;

  return `
    <h2 style="font-family:sans-serif">AFG Part Procurement Request</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      <tr><th colspan="2" style="background:#222;color:#fff;padding:6px 8px;text-align:left">General Information</th></tr>
      ${row('Date', f.date)}
      ${row('Technician', f.technician)}
      ${row('Training Center', f.trainingCenter)}
      ${row('Simulator', f.simulator)}
      ${row('Priority', f.priority)}
      ${row('Discrepancy Number', f.discrepancyNumber)}
      <tr><th colspan="2" style="background:#222;color:#fff;padding:6px 8px;text-align:left">Part Information</th></tr>
      ${row('Part Number', f.partNumber)}
      ${row('Part Description', f.partDescription)}
      ${row('Quantity', f.quantity)}
      ${row('Reason', f.reason)}
      <tr><th colspan="2" style="background:#222;color:#fff;padding:6px 8px;text-align:left">Repairable Part</th></tr>
      ${row('Repairable Part Number', f.repairablePartNumber)}
      ${row('Repairable Part Description', f.repairablePartDescription)}
      ${row('Repairable Serial Number', f.repairableSerialNumber)}
    </table>
    <p style="font-family:sans-serif;font-size:12px;color:#666">The completed parts request PDF is attached.</p>
  `;
}
