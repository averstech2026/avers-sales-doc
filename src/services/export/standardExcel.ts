import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Estimate, StandardLineItem } from '../../types';
import { getVersionLabel } from '../../constants/version';
import { formatDate } from '../../utils/calculator';
import {
  calculateLineTotal,
  calculateStandardTotals,
} from '../../utils/standardCalculator';

const FONT = 'Segoe UI';
const CURRENCY_FMT = '#,##0" ₽"';
const LAST_COL = 6;

function schemeLabel(item: StandardLineItem): string {
  if (item.paymentScheme === 'rent') return 'Аренда (в месяц)';
  if (item.paymentScheme === 'buyout') return 'Выкуп (бессрочно)';
  return 'Фикс. оплата';
}

export async function exportStandardToExcel(estimate: Estimate): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Аверс Технолоджи';
  workbook.company = getVersionLabel();

  const sheet = workbook.addWorksheet('Спецификация', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  const items = estimate.standardItems ?? [];
  const totals = calculateStandardTotals(items, estimate.vatRate ?? 0.05);
  const lastColLetter = String.fromCharCode(64 + LAST_COL);

  sheet.mergeCells(`A1:${lastColLetter}1`);
  const titleCell = sheet.getCell('A1');
  titleCell.value = `КП: ${estimate.projectName}`;
  titleCell.font = { name: FONT, bold: true, size: 16 };
  titleCell.alignment = { horizontal: 'center' };

  sheet.mergeCells(`A2:${lastColLetter}2`);
  sheet.getCell('A2').value = `Заказчик: ${estimate.clientName || '—'}  |  Дата: ${formatDate(estimate.updatedAt)}`;
  sheet.getCell('A2').font = { name: FONT, size: 10, color: { argb: 'FF64748B' } };
  sheet.getCell('A2').alignment = { horizontal: 'center' };

  sheet.addRow([]);

  const header = sheet.addRow(['№', 'Наименование', 'Тип оплаты', 'Цена за ед.', 'Кол-во', 'Стоимость']);
  header.font = { name: FONT, bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF475569' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });

  sheet.columns = [{ width: 6 }, { width: 48 }, { width: 22 }, { width: 14 }, { width: 10 }, { width: 18 }];

  items.forEach((item, index) => {
    const nameBlock = [
      item.name,
      item.note?.trim() ? `Примечание: ${item.note.trim()}` : '',
      item.description || '',
    ]
      .filter(Boolean)
      .join('\n');
    const row = sheet.addRow([
      index + 1,
      nameBlock,
      schemeLabel(item),
      item.unitPrice,
      item.quantity,
      calculateLineTotal(item),
    ]);
    row.getCell(2).alignment = { wrapText: true, vertical: 'top' };
    row.getCell(4).numFmt = CURRENCY_FMT;
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(6).font = { name: FONT, bold: true };
  });

  sheet.addRow([]);
  const addTotal = (label: string, value: number, bold = false) => {
    const row = sheet.addRow(['', label, '', '', '', value]);
    row.getCell(2).font = { name: FONT, bold, size: bold ? 12 : 11 };
    row.getCell(6).numFmt = CURRENCY_FMT;
    row.getCell(6).font = { name: FONT, bold, size: bold ? 12 : 11 };
  };

  addTotal('Единоразово без НДС', totals.oneTimeSubtotal);
  addTotal(`НДС ${Math.round(totals.vatRate * 100)}%`, totals.vat);
  addTotal('Единоразово с НДС', totals.oneTimeWithVat, true);
  if (totals.recurringMonthly > 0) {
    const rentRow = sheet.addRow(['', 'Аренда в месяц', '', '', '', totals.recurringMonthly]);
    rentRow.getCell(6).numFmt = CURRENCY_FMT;
    rentRow.getCell(6).font = { name: FONT, bold: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const safeName = estimate.projectName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '').trim() || 'kp';
  saveAs(blob, `КП_${safeName}.xlsx`);
}
