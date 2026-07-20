import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Estimate } from '../../types';
import { ROLES, VAT_RATE } from '../../constants/roles';
import { getVersionLabel } from '../../constants/version';
import {
  calculateSectionTotals,
  calculateEstimateTotals,
  formatDate,
} from '../../utils/calculator';
import { exportStandardToExcel } from './standardExcel';
import { isStandardEstimate, formatNumberedSectionTitle } from '../../utils/estimateFactory';

const FONT = 'Segoe UI';
const CURRENCY_FMT = '#,##0" ₽"';

const COLORS = {
  headerBg: 'FF475569',
  headerText: 'FFFFFFFF',
  headerRate: 'FFE2E8F0',
  sectionText: 'FF0F172A',
  sectionBg: 'FFF8FAFC',
  sectionBorder: 'FFE2E8F0',
  bodyText: 'FF1E293B',
  descText: 'FF64748B',
  zeroHours: 'FFCBD5E1',
  totalBg: 'FFFEF2F2',
  totalBorder: 'FFEF4444',
  accentRed: 'FFEF4444',
  emerald: 'FF10B981',
  mutedText: 'FF64748B',
} as const;

const COST_COL = ROLES.length + 3;
const LAST_COL_LETTER = String.fromCharCode(64 + COST_COL);

function styleTableHeader(cell: ExcelJS.Cell, richValue?: ExcelJS.CellRichTextValue) {
  cell.value = richValue ?? cell.value;
  cell.font = { name: FONT, bold: true, color: { argb: COLORS.headerText }, size: 10 };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
}

function roleHeaderRichText(shortName: string, rate: number): ExcelJS.CellRichTextValue {
  const rateLabel = `${rate.toLocaleString('ru-RU')} ₽`;
  return {
    richText: [
      { font: { name: FONT, bold: true, size: 10, color: { argb: COLORS.headerText } }, text: shortName },
      { font: { name: FONT, bold: false, size: 9, color: { argb: COLORS.headerRate } }, text: `\n${rateLabel}` },
    ],
  };
}

function styleHoursCell(cell: ExcelJS.Cell, hours: number) {
  const value = hours || 0;
  cell.value = value === 0 ? 0 : value;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.font = {
    name: FONT,
    size: 10,
    color: { argb: value === 0 ? COLORS.zeroHours : COLORS.bodyText },
  };
}

function styleCostCell(cell: ExcelJS.Cell, value: number, options?: { bold?: boolean; color?: string }) {
  cell.value = value;
  cell.numFmt = CURRENCY_FMT;
  cell.alignment = { vertical: 'middle', horizontal: 'right' };
  cell.font = {
    name: FONT,
    size: 10,
    bold: options?.bold ?? false,
    color: options?.color ? { argb: options.color } : { argb: COLORS.bodyText },
  };
}

function styleSectionRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > COST_COL) return;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.sectionBg } };
    cell.border = {
      bottom: { style: 'thin', color: { argb: COLORS.sectionBorder } },
    };
    if (colNumber === 2) {
      cell.font = { name: FONT, bold: true, size: 11, color: { argb: COLORS.sectionText } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    }
  });
}

function styleSectionTotalRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber > COST_COL) return;

    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.totalBg } };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.totalBorder } },
    };

    if (colNumber === 2) {
      cell.font = { name: FONT, bold: true, size: 10, color: { argb: COLORS.bodyText } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
      return;
    }

    if (colNumber === COST_COL) {
      styleCostCell(cell, cell.value as number, { bold: true, color: COLORS.accentRed });
      return;
    }

    if (colNumber >= 3) {
      const hours = (cell.value as number) || 0;
      cell.font = {
        name: FONT,
        bold: true,
        size: 10,
        color: { argb: hours === 0 ? COLORS.zeroHours : COLORS.bodyText },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  });
}

function addDescriptionRow(sheet: ExcelJS.Worksheet, description: string) {
  const descRow = sheet.addRow(Array(COST_COL).fill(''));
  descRow.height = 14;

  sheet.mergeCells(descRow.number, 1, descRow.number, 2);
  const descCell = descRow.getCell(1);
  descCell.value = description;
  descCell.font = { name: FONT, italic: true, size: 9, color: { argb: COLORS.descText } };
  descCell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true };
}

function addGrandTotalRow(
  sheet: ExcelJS.Worksheet,
  label: string,
  value: number,
  options?: { bold?: boolean; labelSize?: number; valueSize?: number; valueColor?: string }
) {
  const row = sheet.addRow(Array(COST_COL).fill(''));
  sheet.mergeCells(row.number, 2, row.number, COST_COL - 1);

  const labelCell = row.getCell(2);
  labelCell.value = label;
  labelCell.font = {
    name: FONT,
    bold: options?.bold ?? false,
    size: options?.labelSize ?? 11,
    color: { argb: COLORS.bodyText },
  };
  labelCell.alignment = { vertical: 'middle', horizontal: 'right' };

  const valueCell = row.getCell(COST_COL);
  valueCell.value = value;
  valueCell.numFmt = CURRENCY_FMT;
  valueCell.alignment = { vertical: 'middle', horizontal: 'right' };
  valueCell.font = {
    name: FONT,
    bold: options?.bold ?? false,
    size: options?.valueSize ?? 11,
    color: { argb: options?.valueColor ?? COLORS.bodyText },
  };
}

export async function exportToExcel(estimate: Estimate): Promise<void> {
  if (isStandardEstimate(estimate)) {
    return exportStandardToExcel(estimate);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Аверс Технолоджи';
  workbook.company = getVersionLabel();

  const sheet = workbook.addWorksheet('Смета', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const totals = calculateEstimateTotals(estimate);

  sheet.mergeCells(`A1:${LAST_COL_LETTER}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = `СМЕТА: ${estimate.projectName}`;
  titleCell.font = { name: FONT, bold: true, size: 16, color: { argb: COLORS.sectionText } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.mergeCells(`A2:${LAST_COL_LETTER}2`);
  const metaCell = sheet.getCell('A2');
  metaCell.value = `Заказчик: ${estimate.clientName || '—'}  |  Дата: ${formatDate(estimate.updatedAt)}`;
  metaCell.font = { name: FONT, size: 10, color: { argb: COLORS.mutedText } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };

  sheet.addRow([]);

  const headerRow = sheet.addRow([
    '№',
    'Этап / Задача',
    ...ROLES.map(() => ''),
    'Стоимость, ₽',
  ]);
  headerRow.height = 36;
  headerRow.getCell(1).value = '№';
  styleTableHeader(headerRow.getCell(1));
  headerRow.getCell(2).value = 'Этап / Задача';
  styleTableHeader(headerRow.getCell(2));
  ROLES.forEach((role, index) => {
    styleTableHeader(headerRow.getCell(index + 3), roleHeaderRichText(role.shortName, estimate.rates[role.id]));
  });
  headerRow.getCell(COST_COL).value = 'Стоимость, ₽';
  styleTableHeader(headerRow.getCell(COST_COL));

  sheet.columns = [
    { width: 6 },
    { width: 50 },
    ...ROLES.map(() => ({ width: 10 })),
    { width: 16 },
  ];

  estimate.sections.forEach((section, sIdx) => {
    const sectionRow = sheet.addRow([
      '',
      formatNumberedSectionTitle(section.name, sIdx),
      ...ROLES.map(() => ''),
      '',
    ]);
    styleSectionRow(sectionRow);

    section.tasks.forEach((task) => {
      const taskCost = ROLES.reduce(
        (sum, role) => sum + (task.hours[role.id] || 0) * estimate.rates[role.id],
        0
      );

      const taskRow = sheet.addRow([
        '',
        task.name,
        ...ROLES.map((r) => task.hours[r.id] || 0),
        taskCost,
      ]);
      taskRow.height = 18;

      taskRow.getCell(2).font = { name: FONT, size: 10, color: { argb: COLORS.bodyText } };
      taskRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      ROLES.forEach((role, index) => {
        styleHoursCell(taskRow.getCell(index + 3), task.hours[role.id] || 0);
      });
      styleCostCell(taskRow.getCell(COST_COL), taskCost);

      const trimmedDescription = task.description.trim();
      if (trimmedDescription) {
        addDescriptionRow(sheet, trimmedDescription);
      }
    });

    const sectionTotals = calculateSectionTotals(section, estimate.rates);
    const totalRow = sheet.addRow([
      '',
      'Итого по разделу',
      ...ROLES.map((r) => sectionTotals.hours[r.id] || 0),
      sectionTotals.cost,
    ]);
    styleSectionTotalRow(totalRow);
  });

  sheet.addRow([]);
  sheet.addRow([]);

  addGrandTotalRow(sheet, 'ИТОГО без НДС', totals.subtotal, { bold: true, labelSize: 12, valueSize: 12 });
  addGrandTotalRow(sheet, `НДС ${VAT_RATE * 100}%`, totals.vat, { labelSize: 11, valueSize: 11 });
  addGrandTotalRow(sheet, 'ИТОГО с учётом НДС', totals.totalWithVat, {
    bold: true,
    labelSize: 13,
    valueSize: 13,
    valueColor: COLORS.emerald,
  });

  const grandTotalRow = sheet.lastRow!;
  grandTotalRow.getCell(2).font = {
    name: FONT,
    bold: true,
    size: 13,
    color: { argb: COLORS.bodyText },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeName = estimate.projectName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '').trim() || 'smeta';
  saveAs(blob, `Смета_${safeName}.xlsx`);
}
