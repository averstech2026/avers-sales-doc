import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Estimate } from '../../types';
import { ROLES } from '../../constants/roles';
import { getCopyrightYear, getVersionLabel } from '../../constants/version';
import {
  calculateSectionTotals,
  calculateEstimateTotals,
  formatCurrency,
  formatDate,
  formatNumber,
} from '../../utils/calculator';
import { AVERS_LOGO } from '../../utils/clientLogo';
import { loadThemeColors } from '../../utils/personalization';

const EMERALD = '#10b981';

function getPdfColors() {
  const theme = loadThemeColors();
  return {
    navy: theme.tableHeader,
    accent: theme.button,
    accentLight: theme.highlightBg,
    cornerAccent: theme.cornersAccent,
    cornerNeutral: theme.cornersNeutral,
    text: '#0f172a',
    textMuted: '#64748b',
    bg: '#f8fafc',
    border: '#e2e8f0',
  };
}

export interface PdfExportOptions {
  clientLogoSrc?: string | null;
  signature?: {
    fullName: string;
    position: string;
  };
}

function pdfStyles(): string {
  const c = getPdfColors();
  return `
    .pdf-page, .pdf-page * { box-sizing: border-box; }
    .pdf-page {
      padding: 28px 32px;
      font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
      color: ${c.text};
      background: #fff;
    }
    .pdf-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 16px;
    }
    .pdf-header__info { flex: 1; min-width: 0; }
    .pdf-header__accent {
      width: 40px;
      height: 3px;
      background: ${c.accent};
      margin-bottom: 10px;
    }
    .pdf-header__title {
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 6px;
      line-height: 1.2;
      letter-spacing: 0.02em;
    }
    .pdf-header__project {
      font-size: 15px;
      font-weight: 600;
      color: ${c.accent};
      margin: 0 0 10px;
    }
    .pdf-header__meta {
      font-size: 12px;
      margin: 0 0 2px;
      color: ${c.text};
    }
    .pdf-header__logos {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }
    .pdf-header__logos img {
      max-height: 42px;
      max-width: 180px;
      object-fit: contain;
    }
    .pdf-summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 16px 0 20px;
    }
    .pdf-summary-card {
      position: relative;
      padding: 10px 14px;
      background: ${c.bg};
    }
    .pdf-summary-card__label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      color: ${c.textMuted};
      margin-bottom: 4px;
    }
    .pdf-summary-card__value {
      font-size: 16px;
      font-weight: 700;
      color: ${c.text};
      line-height: 1.2;
    }
    .pdf-summary-card__value--accent {
      font-size: 18px;
      color: ${EMERALD};
    }
    .pdf-section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      margin: 0 0 4px;
    }
    .pdf-section-accent {
      width: 32px;
      height: 3px;
      background: ${c.accent};
      margin-bottom: 12px;
    }
    .pdf-table-wrap { overflow-x: auto; }
    .pdf-table {
      table-layout: fixed;
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .pdf-table thead tr {
      background: ${c.navy};
      color: #fff;
    }
    .pdf-table th {
      padding: 7px 6px;
      font-size: 9px;
      font-weight: 600;
    }
    .pdf-table th:first-child { text-align: left; }
    .pdf-table th:last-child { text-align: right; }
    .pdf-table th:not(:first-child):not(:last-child) { text-align: center; }
    .pdf-table td {
      padding: 5px 6px;
      vertical-align: top;
    }
    .pdf-table .section-row td {
      padding: 8px 6px;
      font-weight: 700;
      font-size: 11px;
      background: ${c.bg};
      border-top: 2px solid ${c.accent};
    }
    .pdf-table .total-row td {
      padding: 7px 6px;
      font-weight: 700;
      font-size: 10px;
      background: ${c.accentLight};
    }
    .pdf-table .total-row td:last-child {
      text-align: right;
      color: ${c.accent};
    }
    .pdf-table .task-cost { text-align: right; font-weight: 600; white-space: nowrap; }
    .pdf-table .task-hours { text-align: center; font-size: 9px; }
    .pdf-table .task-desc {
      margin-top: 3px;
      font-size: 9px;
      line-height: 1.4;
      color: ${c.textMuted};
      word-wrap: break-word;
    }
    .pdf-table tbody { page-break-inside: avoid; }
    .pdf-table tr { page-break-inside: avoid; }
    .pdf-grand-totals {
      margin-top: 16px;
      text-align: right;
      page-break-inside: avoid;
    }
    .pdf-grand-totals__row {
      font-size: 11px;
      margin-bottom: 3px;
    }
    .pdf-grand-totals__final {
      font-size: 14px;
      font-weight: 800;
      color: ${EMERALD};
      margin-top: 4px;
    }
    .pdf-signatures {
      margin-top: 24px;
      display: flex;
      justify-content: flex-start;
      gap: 48px;
      font-size: 10px;
      color: ${c.textMuted};
      page-break-inside: avoid;
    }
    .pdf-signatures__col { width: 240px; }
    .pdf-signatures__heading {
      font-weight: 600;
      color: ${c.text};
      margin-bottom: 8px;
      font-size: 10px;
    }
    .pdf-signatures__org {
      margin-bottom: 2px;
      color: ${c.text};
      font-size: 10px;
    }
    .pdf-signatures__line {
      border-bottom: 1px solid ${c.border};
      width: 160px;
      height: 20px;
      margin: 6px 0 4px;
    }
    .pdf-signatures__name {
      font-size: 10px;
      color: ${c.text};
      font-weight: 600;
    }
    .pdf-signatures__position {
      font-size: 9px;
      margin-top: 1px;
    }
    .pdf-footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid ${c.border};
      font-size: 9px;
      color: #94a3b8;
      page-break-inside: avoid;
    }
    .pdf-description {
      margin: 0 0 16px;
      font-size: 11px;
      line-height: 1.5;
      color: ${c.textMuted};
    }
  `;
}

function cornerFrameHtml(): string {
  const colors = getPdfColors();
  const size = 14;
  const w = '1.5px';
  return `
    <div style="position:absolute;top:0;left:0;width:${size}px;height:${size}px;border-top:${w} solid ${colors.cornerNeutral};border-left:${w} solid ${colors.cornerNeutral};"></div>
    <div style="position:absolute;top:0;right:0;width:${size}px;height:${size}px;border-top:${w} solid ${colors.cornerAccent};border-right:${w} solid ${colors.cornerAccent};"></div>
    <div style="position:absolute;bottom:0;left:0;width:${size}px;height:${size}px;border-bottom:${w} solid ${colors.cornerAccent};border-left:${w} solid ${colors.cornerAccent};"></div>
    <div style="position:absolute;bottom:0;right:0;width:${size}px;height:${size}px;border-bottom:${w} solid ${colors.cornerNeutral};border-right:${w} solid ${colors.cornerNeutral};"></div>
  `;
}

function imgTag(src: string, alt: string): string {
  const isExternal = src.startsWith('http') && !src.startsWith(window.location.origin);
  const corsAttr = isExternal ? ' crossorigin="anonymous"' : '';
  return `<img src="${src}" alt="${alt}"${corsAttr} />`;
}

function resolveAbsoluteUrl(src: string): string {
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
  return new URL(src.replace(/^\//, ''), base).href;
}

function buildPageHeaderHtml(estimate: Estimate, clientLogoSrc: string | null): string {
  const aversLogo = resolveAbsoluteUrl(AVERS_LOGO);
  const clientLogo = clientLogoSrc ? resolveAbsoluteUrl(clientLogoSrc) : null;

  const logosHtml = [
    imgTag(aversLogo, 'Аверс Технолоджи'),
    clientLogo ? imgTag(clientLogo, 'Заказчик') : '',
  ]
    .filter(Boolean)
    .join('');

  return `
    <div class="pdf-header">
      <div class="pdf-header__info">
        <div class="pdf-header__accent"></div>
        <h1 class="pdf-header__title">Коммерческое предложение</h1>
        <h2 class="pdf-header__project">${escapeHtml(estimate.projectName)}</h2>
        <p class="pdf-header__meta"><strong>Заказчик:</strong> ${escapeHtml(estimate.clientName || '—')}</p>
        <p class="pdf-header__meta"><strong>Дата:</strong> ${formatDate(estimate.updatedAt)}</p>
      </div>
      <div class="pdf-header__logos">${logosHtml}</div>
    </div>
  `;
}

function buildSummaryCardsHtml(totals: ReturnType<typeof calculateEstimateTotals>): string {
  const cards = [
    { label: 'Итого с НДС', value: formatCurrency(totals.totalWithVat), accent: true },
    { label: 'Без НДС', value: formatCurrency(totals.subtotal), accent: false },
    { label: 'НДС 5%', value: formatCurrency(totals.vat), accent: false },
    { label: 'Всего часов', value: formatNumber(totals.totalHours), accent: false },
  ];

  return `
    <div class="pdf-summary-cards">
      ${cards
        .map(
          (card) => `
        <div class="pdf-summary-card">
          ${cornerFrameHtml()}
          <div class="pdf-summary-card__label">${card.label}</div>
          <div class="pdf-summary-card__value${card.accent ? ' pdf-summary-card__value--accent' : ''}">${card.value}</div>
        </div>`
        )
        .join('')}
    </div>
  `;
}

function buildSignatureBlockHtml(
  estimate: Estimate,
  signature?: PdfExportOptions['signature']
): string {
  const signerName = signature?.fullName?.trim() ?? '';
  const signerPosition = signature?.position?.trim() ?? '';

  return `
    <div class="pdf-signatures">
      <div class="pdf-signatures__col">
        <div class="pdf-signatures__heading">Исполнитель</div>
        <div class="pdf-signatures__org">ООО «Аверс Технолоджи»</div>
        <div class="pdf-signatures__line"></div>
        ${signerName ? `<div class="pdf-signatures__name">${escapeHtml(signerName)}</div>` : ''}
        ${signerPosition ? `<div class="pdf-signatures__position">${escapeHtml(signerPosition)}</div>` : ''}
      </div>
      <div class="pdf-signatures__col">
        <div class="pdf-signatures__heading">Заказчик</div>
        <div class="pdf-signatures__org">${escapeHtml(estimate.clientName || '—')}</div>
        <div class="pdf-signatures__line"></div>
      </div>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildTableHtml(estimate: Estimate): string {
  const roleHeaders = ROLES.map((r) => `<th>${r.shortName}</th>`).join('');

  const sectionsHtml = estimate.sections
    .map((section, sIdx) => {
      const sectionTotals = calculateSectionTotals(section, estimate.rates);

      const tasksHtml = section.tasks
        .map((task) => {
          const cost = ROLES.reduce(
            (sum, role) => sum + (task.hours[role.id] || 0) * estimate.rates[role.id],
            0
          );

          const hoursCells = ROLES.map((r) => {
            const h = task.hours[r.id];
            return `<td class="task-hours">${h ? h : '—'}</td>`;
          }).join('');

          const descriptionHtml = task.description.trim()
            ? `<div class="task-desc">${escapeHtml(task.description)}</div>`
            : '';

          return `
            <tr>
              <td>
                <div>${escapeHtml(task.name)}</div>
                ${descriptionHtml}
              </td>
              ${hoursCells}
              <td class="task-cost">${formatCurrency(cost)}</td>
            </tr>`;
        })
        .join('');

      const totalHoursCells = ROLES.map(
        (r) => `<td class="task-hours">${sectionTotals.hours[r.id] || 0}</td>`
      ).join('');

      return `
        <tbody>
          <tr class="section-row">
            <td colspan="${ROLES.length + 2}">${sIdx + 1}. ${escapeHtml(section.name)}</td>
          </tr>
          ${tasksHtml}
          <tr class="total-row">
            <td>Итого по разделу</td>
            ${totalHoursCells}
            <td>${formatCurrency(sectionTotals.cost)}</td>
          </tr>
        </tbody>`;
    })
    .join('');

  return `
    <h2 class="pdf-section-title">Детализация сметы</h2>
    <div class="pdf-section-accent"></div>
    <div class="pdf-table-wrap">
      <table class="pdf-table">
        <colgroup>
          <col />
          ${ROLES.map(() => `<col style="width:56px;" />`).join('')}
          <col style="width:100px;" />
        </colgroup>
        <thead>
          <tr>
            <th>Задача</th>
            ${roleHeaders}
            <th>Стоимость</th>
          </tr>
        </thead>
        ${sectionsHtml}
      </table>
    </div>
  `;
}

function buildGrandTotalsHtml(totals: ReturnType<typeof calculateEstimateTotals>): string {
  return `
    <div class="pdf-grand-totals">
      <div class="pdf-grand-totals__row">Итого без НДС: <strong>${formatCurrency(totals.subtotal)}</strong></div>
      <div class="pdf-grand-totals__row">НДС 5%: <strong>${formatCurrency(totals.vat)}</strong></div>
      <div class="pdf-grand-totals__final">Итого с НДС: ${formatCurrency(totals.totalWithVat)}</div>
    </div>
  `;
}

function buildFooterHtml(): string {
  return `
    <div class="pdf-footer">
      © ${getCopyrightYear()} ООО «Аверс Технолоджи» · ${getVersionLabel()} · Документ сформирован автоматически
    </div>
  `;
}

function buildDocumentPage(
  estimate: Estimate,
  totals: ReturnType<typeof calculateEstimateTotals>,
  options: PdfExportOptions
): string {
  const clientLogoSrc = options.clientLogoSrc ?? null;
  const descriptionBlock = estimate.description
    ? `<p class="pdf-description">${escapeHtml(estimate.description)}</p>`
    : '';

  return `
    <div class="pdf-page">
      ${buildPageHeaderHtml(estimate, clientLogoSrc)}
      ${buildSummaryCardsHtml(totals)}
      ${descriptionBlock}
      ${buildTableHtml(estimate)}
      ${buildGrandTotalsHtml(totals)}
      ${buildSignatureBlockHtml(estimate, options.signature)}
      ${buildFooterHtml()}
    </div>
  `;
}

export function buildPdfHtml(estimate: Estimate, options: PdfExportOptions = {}): string {
  const totals = calculateEstimateTotals(estimate);
  return buildDocumentPage(estimate, totals, options);
}

async function waitForImages(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

export async function exportToPdf(estimate: Estimate, options: PdfExportOptions = {}): Promise<void> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#fff';

  const styleEl = document.createElement('style');
  styleEl.textContent = pdfStyles();
  container.appendChild(styleEl);
  container.insertAdjacentHTML('beforeend', buildPdfHtml(estimate, options));

  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
    const pageEl = container.querySelector<HTMLElement>('.pdf-page');
    if (!pageEl) return;

    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
    } else {
      let remaining = imgHeight;
      let srcY = 0;
      const pageCanvasHeight = (pdfHeight * canvas.width) / pdfWidth;

      while (remaining > 0) {
        const sliceHeight = Math.min(pageCanvasHeight, canvas.height - srcY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeight;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;

        ctx.drawImage(canvas, 0, srcY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const sliceData = sliceCanvas.toDataURL('image/png');
        const slicePdfHeight = (sliceHeight * pdfWidth) / canvas.width;

        if (srcY > 0) pdf.addPage();
        pdf.addImage(sliceData, 'PNG', 0, 0, pdfWidth, slicePdfHeight);

        srcY += sliceHeight;
        remaining -= slicePdfHeight;
      }
    }

    const safeName = estimate.projectName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '').trim() || 'kp';
    pdf.save(`КП_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
