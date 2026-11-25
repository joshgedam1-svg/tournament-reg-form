import ExcelJS from 'exceljs';
import { PlayerWithPayment } from '@/types/player';
import { formatDate } from '@/lib/utils/format';

function formatEnumLabel(value: string | null | undefined, fallback = 'N/A'): string {
  if (!value) return fallback;
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, letter => letter.toUpperCase());
}

function formatBowlingSummary(arm?: string | null, type?: string | null): string {
  if (!arm || arm === 'do_not_bowl') return 'Do Not Bowl';
  const armLabel = formatEnumLabel(arm);
  if (!type || type === 'not_applicable') return armLabel;
  return `${armLabel} (${formatEnumLabel(type)})`;
}

function getStatusColors(status: string): { font: string; fill: string } {
  const normalized = status.toLowerCase();
  if (normalized === 'approved' || normalized === 'verified') {
    return { font: 'FF065F46', fill: 'FFD1FAE5' };
  }
  if (normalized === 'rejected' || normalized === 'unpaid') {
    return { font: 'FF991B1B', fill: 'FFFEE2E2' };
  }
  return { font: 'FF92400E', fill: 'FFFEF3C7' };
}

interface SectionGroup {
  title: string;
  startCol: number;
  endCol: number;
  bgColor: string;
}

function applySectionHeaders(
  sheet: ExcelJS.Worksheet,
  sections: SectionGroup[],
  headers: string[]
) {
  const sectionRow = sheet.getRow(1);
  sectionRow.height = 24;

  for (const section of sections) {
    if (section.endCol > section.startCol) {
      sheet.mergeCells(1, section.startCol, 1, section.endCol);
    }
    const cell = sectionRow.getCell(section.startCol);
    cell.value = section.title;
    cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: section.bgColor }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };

    for (let c = section.startCol; c <= section.endCol; c++) {
      sectionRow.getCell(c).border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
        right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
      };
    }
  }

  const headerRow = sheet.getRow(2);
  headerRow.height = 24;
  headers.forEach((header, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = header;
    cell.font = { bold: true, size: 10.5, color: { argb: 'FF0F172A' }, name: 'Calibri' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF475569' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  sheet.views = [{ state: 'frozen', ySplit: 2 }];
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: headers.length }
  };
}

function styleDataRow(
  row: ExcelJS.Row,
  colCount: number,
  rowIndex: number,
  textColumns: Set<number>,
  statusColumns: Set<number>
) {
  row.height = 21;
  const zebraFill = rowIndex % 2 === 1 ? 'FFF8FAFC' : 'FFFFFFFF';

  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { size: 10, color: { argb: 'FF1E293B' }, name: 'Calibri' };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    };

    if (textColumns.has(c)) {
      cell.numFmt = '@';
    }

    if (statusColumns.has(c) && typeof cell.value === 'string') {
      const colors = getStatusColors(cell.value);
      cell.font = { bold: true, size: 10, color: { argb: colors.font }, name: 'Calibri' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.fill }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: zebraFill }
      };
    }
  }
}

function autoFitColumns(
  sheet: ExcelJS.Worksheet,
  headers: string[],
  minWidths: number[] = [],
  maxWidth = 42
) {
  headers.forEach((header, idx) => {
    const colIndex = idx + 1;
    let maxLen = header.length + 3;

    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip merged section banner
      const val = row.getCell(colIndex).value;
      const text = val === null || val === undefined ? '' : String(val);
      if (text.length + 3 > maxLen) {
        maxLen = text.length + 3;
      }
    });

    const minW = minWidths[idx] ?? 12;
    sheet.getColumn(colIndex).width = Math.min(Math.max(maxLen, minW), maxWidth);
  });
}

/**
 * Generates a multi-sheet .xlsx workbook containing:
 * 1. "Player List" - clean core columns in separate Excel columns & sections.
 * 2. "Full Player Details" - complete 28-column registration & payment export.
 */
export async function buildPlayersWorkbookBuffer(players: PlayerWithPayment[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Cricket Auction League';
  workbook.created = new Date();

  // ============================================================================
  // SHEET 1: Player List (Exact core columns requested, separated cleanly)
  // ============================================================================
  const summarySheet = workbook.addWorksheet('Player List', {
    properties: { defaultRowHeight: 21 }
  });

  const summarySections: SectionGroup[] = [
    { title: 'PLAYER INFO', startCol: 1, endCol: 4, bgColor: 'FF065F46' },
    { title: 'CRICKET PROFILE', startCol: 5, endCol: 7, bgColor: 'FF1E3A8A' },
    { title: 'LOCATION', startCol: 8, endCol: 8, bgColor: 'FF0F766E' },
    { title: 'PAYMENT & STATUS', startCol: 9, endCol: 11, bgColor: 'FF4338CA' }
  ];

  const summaryHeaders = [
    'Registration ID',
    'Name',
    'Email',
    'Mobile',
    'Role',
    'Batting',
    'Bowling',
    'City',
    'Payment Status',
    'UTR',
    'Registration Status'
  ];

  applySectionHeaders(summarySheet, summarySections, summaryHeaders);

  const summaryTextCols = new Set([1, 4, 10]); // Reg ID, Mobile, UTR
  const summaryStatusCols = new Set([9, 11]); // Payment Status, Registration Status

  players.forEach((p, idx) => {
    const paymentStatus = p.payment?.payment_status
      ? formatEnumLabel(p.payment.payment_status)
      : 'Unpaid';
    const regStatus = formatEnumLabel(p.registration_status);

    const row = summarySheet.addRow([
      p.registration_id || '',
      (p.full_name || '').trim(),
      (p.email || '').trim(),
      (p.mobile || '').trim(),
      formatEnumLabel(p.playing_role),
      formatEnumLabel(p.batting_style),
      formatBowlingSummary(p.bowling_arm, p.bowling_type),
      (p.city || '').trim(),
      paymentStatus,
      p.payment?.utr_number ? String(p.payment.utr_number).trim() : 'N/A',
      regStatus
    ]);

    styleDataRow(row, summaryHeaders.length, idx, summaryTextCols, summaryStatusCols);
    row.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF0F172A' }, name: 'Calibri' };
  });

  autoFitColumns(summarySheet, summaryHeaders, [18, 22, 26, 18, 15, 14, 22, 14, 20, 18, 19]);

  // ============================================================================
  // SHEET 2: Full Player Details (All 28 registration, payment & history fields)
  // ============================================================================
  const fullSheet = workbook.addWorksheet('Full Player Details', {
    properties: { defaultRowHeight: 21 }
  });

  const fullSections: SectionGroup[] = [
    { title: 'PLAYER IDENTITY & CONTACT', startCol: 1, endCol: 7, bgColor: 'FF065F46' },
    { title: 'CRICKET PROFILE', startCol: 8, endCol: 12, bgColor: 'FF1E3A8A' },
    { title: 'PAYMENT DETAILS', startCol: 13, endCol: 17, bgColor: 'FF0F766E' },
    { title: 'REGISTRATION & REVIEW', startCol: 18, endCol: 20, bgColor: 'FF4338CA' },
    { title: 'PREVIOUS TOURNAMENT & EMERGENCY', startCol: 21, endCol: 28, bgColor: 'FF334155' }
  ];

  const fullHeaders = [
    'Registration ID',
    'Full Name',
    'Email Address',
    'Mobile Number',
    'Date of Birth',
    'City',
    'Full Address',
    'Playing Role',
    'Batting Style',
    'Bowling Arm',
    'Bowling Type',
    'Experience Level',
    'Payment Status',
    'Amount Paid (INR)',
    'Payment Method',
    'UTR / Transaction ID',
    'Payment Verified Date',
    'Registration Status',
    'Review / Rejection Remarks',
    'Registered Date',
    'Played Previous Tournament',
    'Previous Team Name',
    'Previous Captain Name',
    'Previous Tournament Name',
    'Additional Notes',
    'Emergency Contact Name',
    'Emergency Relationship',
    'Emergency Mobile'
  ];

  applySectionHeaders(fullSheet, fullSections, fullHeaders);

  const fullTextCols = new Set([1, 4, 16, 28]); // Reg ID, Mobile, UTR, Emergency Mobile
  const fullStatusCols = new Set([13, 18]); // Payment Status, Registration Status

  players.forEach((p, idx) => {
    const paymentStatus = p.payment?.payment_status
      ? formatEnumLabel(p.payment.payment_status)
      : 'Unpaid';
    const regStatus = formatEnumLabel(p.registration_status);

    const row = fullSheet.addRow([
      p.registration_id || '',
      (p.full_name || '').trim(),
      (p.email || '').trim(),
      (p.mobile || '').trim(),
      p.date_of_birth ? formatDate(p.date_of_birth) : '',
      (p.city || '').trim(),
      (p.address || '').trim(),
      formatEnumLabel(p.playing_role),
      formatEnumLabel(p.batting_style),
      formatEnumLabel(p.bowling_arm),
      formatEnumLabel(p.bowling_type),
      formatEnumLabel(p.experience_level),
      paymentStatus,
      p.payment?.amount != null ? Number(p.payment.amount) : 0,
      p.payment?.payment_method ? formatEnumLabel(p.payment.payment_method) : 'UPI',
      p.payment?.utr_number ? String(p.payment.utr_number).trim() : 'N/A',
      p.payment?.verified_at ? formatDate(p.payment.verified_at) : 'N/A',
      regStatus,
      p.rejection_reason || p.payment?.rejection_reason || 'N/A',
      p.created_at ? formatDate(p.created_at) : 'N/A',
      p.previous_tournament ? 'Yes' : 'No',
      p.previous_team_name || 'N/A',
      p.previous_captain_name || 'N/A',
      p.previous_tournament_name || 'N/A',
      p.additional_information || 'N/A',
      p.emergency_contact_name || 'N/A',
      p.emergency_relationship || 'N/A',
      p.emergency_mobile ? String(p.emergency_mobile).trim() : 'N/A'
    ]);

    styleDataRow(row, fullHeaders.length, idx, fullTextCols, fullStatusCols);
    row.getCell(1).font = { bold: true, size: 10, color: { argb: 'FF0F172A' }, name: 'Calibri' };
    row.getCell(14).numFmt = '₹#,##0';
    row.getCell(14).alignment = { vertical: 'middle', horizontal: 'right' };
  });

  autoFitColumns(fullSheet, fullHeaders, [18, 22, 26, 18, 15, 14, 28, 15, 14, 15, 15, 16, 20, 16, 15, 20, 18, 19, 26, 16]);

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
