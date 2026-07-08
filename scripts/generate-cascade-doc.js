/**
 * BGV Platform — Status Cascade Rules PDF Generator
 * Run:  node scripts/generate-cascade-doc.js
 * Output: ../../BGV_Status_Cascade_Rules.pdf  (project root)
 */

const PDFDocument = require('pdfkit');
const fs          = require('fs');
const path        = require('path');

const OUT_PATH = path.resolve(__dirname, '../../BGV_Status_Cascade_Rules.pdf');

// ── Data ──────────────────────────────────────────────────────────────────────
const CASCADE_RULES = [
  {
    targetStatus: 'CREATED',
    actions: [
      'Doc status reset to UPLOADED on all case files',
      'Field assignments marked CANCELLED',
      'All field visits hard-deleted',
      'All evidence files hard-deleted',
      'Coordinator remarks cleared (null)',
      'Match results stripped from file metadata',
      'Report record hard-deleted',
    ],
  },
  {
    targetStatus: 'OCR_COMPLETED',
    actions: [
      'Doc status reset to DATA_EXTRACTED on all case files',
      'Field assignments marked CANCELLED',
      'All field visits hard-deleted',
      'All evidence files hard-deleted',
      'Coordinator remarks cleared (null)',
      'Match results stripped from file metadata',
      'Report record hard-deleted',
    ],
  },
  {
    targetStatus: 'MD_SIGNED',
    actions: [
      'Field assignments marked CANCELLED',
      'All field visits hard-deleted',
      'All evidence files hard-deleted',
      'Coordinator remarks cleared (null)',
      'Match results stripped from file metadata',
      'Report record hard-deleted',
    ],
  },
  {
    targetStatus: 'FIELD_ASSIGNED',
    actions: [
      'All field visits hard-deleted',
      'All evidence files hard-deleted',
      'Coordinator remarks cleared (null)',
      'Match results stripped from file metadata',
      'Report record hard-deleted',
    ],
  },
  {
    targetStatus: 'FIELD_SUBMITTED',
    actions: [
      'Coordinator remarks cleared (null)',
      'Match results stripped from file metadata',
      'Report record hard-deleted',
    ],
  },
  {
    targetStatus: 'UNDER_REVIEW',
    actions: [
      'Match results stripped from file metadata',
      'Report record hard-deleted',
    ],
  },
  {
    targetStatus: 'REPORT_DRAFT',
    actions: [
      'Report record hard-deleted (fresh slate for writer)',
    ],
  },
  {
    targetStatus: 'QC_PENDING or later',
    actions: [
      'Status label change only — no data is touched',
    ],
  },
];

const NOTES = [
  'OCR fields (ocrFields in case_files.metadata) are NEVER cleared — they are always preserved.',
  'Field assignments are soft-cancelled (status = CANCELLED), not deleted, to preserve audit trail.',
  'Field visits and evidence files are hard-deleted for a clean slate on re-work.',
  'Reports are hard-deleted (including all report events via cascade) so the report writer starts fresh.',
  'All operations run inside a single DB transaction — either everything commits or nothing does.',
  'The override endpoint is POST /cases/:id/override-status and requires a mandatory reason field.',
  'Every override is logged to case_status_history with the old status, new status, reason, and timestamp.',
];

// ── PDF ───────────────────────────────────────────────────────────────────────
const doc = new PDFDocument({ margin: 50, size: 'A4' });
const stream = fs.createWriteStream(OUT_PATH);
doc.pipe(stream);

const W       = doc.page.width - 100;
const INDIGO  = '#4f46e5';
const RED     = '#dc2626';
const SLATE   = '#475569';
const LIGHT   = '#f8faff';
const BORDER  = '#e2e8f0';
const TEXT    = '#1e293b';

// ── Header ────────────────────────────────────────────────────────────────────
doc
  .rect(50, 50, W, 60).fill(INDIGO)
  .fillColor('#ffffff').font('Helvetica-Bold').fontSize(16)
  .text('BGV Platform', 66, 64)
  .font('Helvetica').fontSize(10)
  .text('Status Override — Cascade Data Rules', 66, 84)
  .fillColor(SLATE).fontSize(8.5)
  .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 66, 98);

doc.moveDown(4.5);

// ── Intro ─────────────────────────────────────────────────────────────────────
doc
  .fillColor(TEXT).font('Helvetica-Bold').fontSize(10)
  .text('What is a Status Override?', 50)
  .font('Helvetica').fontSize(9).fillColor(SLATE)
  .text(
    'A status override allows administrators to forcefully set a case to any pipeline stage, ' +
    'bypassing normal workflow transitions. Unlike a regular status change, an override also ' +
    'cascades data resets — wiping all records that belong to stages AFTER the target status. ' +
    'This ensures the case is genuinely back in that stage, not just re-labelled.',
    50, undefined, { width: W }
  );

doc.moveDown(1.5);

// ── Cascade table ─────────────────────────────────────────────────────────────
doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10).text('Cascade Rules by Target Status', 50);
doc.moveDown(0.5);

const COL1 = 160;
const COL2 = W - COL1;
const ROW_PAD = 8;

// Table header
const hdrY = doc.y;
doc.rect(50, hdrY, W, 20).fill(INDIGO);
doc
  .fillColor('#ffffff').font('Helvetica-Bold').fontSize(8.5)
  .text('Roll Back To', 58, hdrY + 6, { width: COL1 - 8 })
  .text('Data Wiped / Reset', 58 + COL1, hdrY + 6, { width: COL2 });

doc.y = hdrY + 20;

CASCADE_RULES.forEach((rule, i) => {
  const isOdd = i % 2 === 0;
  const lineHeight = 11;
  const lines = rule.actions.length;
  const rowH = Math.max(lines * lineHeight + ROW_PAD * 2, 28);

  const rowY = doc.y;

  // Row background
  doc.rect(50, rowY, W, rowH).fill(isOdd ? LIGHT : '#ffffff');
  // Border
  doc.rect(50, rowY, W, rowH).stroke(BORDER);

  // Status label
  const isNoOp = rule.targetStatus === 'QC_PENDING or later';
  doc
    .fillColor(isNoOp ? '#16a34a' : RED)
    .font('Helvetica-Bold').fontSize(8)
    .text(rule.targetStatus, 58, rowY + ROW_PAD, { width: COL1 - 16 });

  // Actions
  rule.actions.forEach((action, ai) => {
    doc
      .fillColor(isNoOp ? '#15803d' : SLATE)
      .font('Helvetica').fontSize(8)
      .text(
        `${isNoOp ? '' : '• '}${action}`,
        58 + COL1,
        rowY + ROW_PAD + ai * lineHeight,
        { width: COL2 - 8 }
      );
  });

  doc.y = rowY + rowH;
});

doc.moveDown(1.5);

// ── Notes ──────────────────────────────────────────────────────────────────────
doc.fillColor(TEXT).font('Helvetica-Bold').fontSize(10).text('Important Notes', 50);
doc.moveDown(0.4);

NOTES.forEach((note) => {
  doc
    .fillColor(SLATE).font('Helvetica').fontSize(8.5)
    .text(`•  ${note}`, 56, undefined, { width: W - 6 });
  doc.moveDown(0.3);
});

doc.moveDown(1);

// ── Footer ────────────────────────────────────────────────────────────────────
doc
  .rect(50, doc.y, W, 1).fill(BORDER)
  .moveDown(0.5)
  .fillColor('#94a3b8').font('Helvetica').fontSize(7.5)
  .text('Trudicon BGV Platform — Internal Technical Reference — Status Override Cascade Rules', 50, undefined, { align: 'center', width: W });

doc.end();

stream.on('finish', () => {
  console.log(`PDF saved: ${OUT_PATH}`);
});
stream.on('error', (err) => {
  console.error('PDF generation failed:', err.message);
  process.exit(1);
});
