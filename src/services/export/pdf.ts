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
import { loadPresentationSlidesLibrary } from '../presentationSlides';
import { buildEmbeddedStandardSlideHtml, buildEmbeddedContactsSlideHtml, embeddedSlideCss } from '../../components/slides/slideTemplate';
import {
  createDefaultSlidesLibrary,
  type PresentationSlidesLibrary,
} from '../../utils/presentationSlides';

/** Brand estimate accents — aligned with web `--color-estimate-rule`. */
const BRAND_RED = '#ef4444';
const CORNER_NEUTRAL = '#475569';
const TOTAL_ROW_BG = '#fef2f2';

function getPdfColors() {
  const theme = loadThemeColors();
  return {
    navy: theme.tableHeader,
    accent: BRAND_RED,
    accentLight: TOTAL_ROW_BG,
    cornerAccent: BRAND_RED,
    cornerNeutral: CORNER_NEUTRAL,
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
  /** Full slides library (defaults + Firestore content). */
  slidesLibrary?: PresentationSlidesLibrary;
}

export function pdfStyles(): string {
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
      flex-direction: column;
      border-bottom: 1.5px solid ${c.accent};
      padding-bottom: 24px;
      margin-bottom: 24px;
    }
    .pdf-document-title-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 16px;
      margin-bottom: 12px;
    }
    .pdf-main-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.3px;
      margin: 0;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .pdf-doc-date {
      font-size: 13px;
      color: ${c.textMuted};
      font-weight: 500;
      flex-shrink: 0;
    }
    .pdf-header-divider {
      height: 1px;
      background-color: #f1f5f9;
      width: 100%;
      margin-bottom: 16px;
    }
    .pdf-parties-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 32px;
    }
    .pdf-header-column {
      display: flex;
      flex-direction: column;
      width: 45%;
      min-width: 0;
    }
    .pdf-header-column.left {
      align-items: flex-start;
      text-align: left;
    }
    .pdf-header-column.right {
      align-items: flex-end;
      text-align: right;
    }
    .column-meta-label {
      font-size: 9px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
      display: block;
    }
    .brand-info-block {
      display: flex;
      flex-direction: column;
    }
    .pdf-header-column.left .brand-info-block {
      align-items: flex-start;
    }
    .pdf-header-column.right .brand-info-block {
      align-items: flex-end;
    }
    .logo-wrapper-pdf {
      height: 28px;
      display: flex;
      align-items: center;
      margin-bottom: 6px;
    }
    .pdf-header-column.right .logo-wrapper-pdf {
      justify-content: flex-end;
    }
    .brand-logo-pdf,
    .client-logo-pdf {
      max-height: 100%;
      width: auto;
      max-width: 200px;
      object-fit: contain;
    }
    .company-name-pdf {
      font-size: 13px;
      font-weight: 600;
      color: #1e293b;
    }
    .kp-author-info {
      font-size: 11px;
      color: ${c.textMuted};
      margin-top: 4px;
      font-weight: 500;
    }
    .project-meta-pdf {
      margin-top: 6px;
      font-size: 12px;
    }
    .project-label {
      color: ${c.textMuted};
    }
    .project-highlight {
      color: #0f172a;
      font-weight: 600;
    }
    .pdf-summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin: 0 0 20px;
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
      color: ${c.accent};
    }
    .pdf-estimation-details-header {
      margin-top: 35px;
      margin-bottom: 15px;
    }
    .pdf-section-title {
      font-size: 15px;
      font-weight: 700;
      color: ${c.text};
      text-transform: none;
      margin: 0 0 6px;
    }
    .pdf-section-accent {
      width: 60px;
      height: 2px;
      background: ${c.accent};
      margin-bottom: 0;
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
      background: ${TOTAL_ROW_BG};
      color: ${c.accent};
      border-bottom: 2px solid ${c.accent};
    }
    .pdf-table .total-row td:last-child {
      text-align: right;
    }
    .pdf-table .total-row .task-hours {
      color: ${c.text};
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
      color: ${c.text};
      margin-top: 6px;
      padding-top: 8px;
      border-top: 2px solid ${c.accent};
    }
    .pdf-grand-totals__final strong {
      color: ${c.accent};
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
    .pdf-description-block {
      margin: 0 0 28px;
      page-break-inside: avoid;
    }
    .pdf-description-title {
      font-size: 15px;
      font-weight: 800;
      color: ${c.text};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 10px;
    }
    .pdf-description {
      margin: 0;
      font-size: 12.5px;
      line-height: 1.5;
      color: #475569;
    }

    /* Embedded presentation slides inside A4 document flow */
    ${embeddedSlideCss()}
  `;
}

function cornerFrameHtml(accent = false): string {
  const colors = getPdfColors();
  const size = 14;
  const w = '1.5px';
  // Uniform graphite corners; accent card uses brand red on all four.
  const color = accent ? colors.cornerAccent : colors.cornerNeutral;
  return `
    <div style="position:absolute;top:0;left:0;width:${size}px;height:${size}px;border-top:${w} solid ${color};border-left:${w} solid ${color};"></div>
    <div style="position:absolute;top:0;right:0;width:${size}px;height:${size}px;border-top:${w} solid ${color};border-right:${w} solid ${color};"></div>
    <div style="position:absolute;bottom:0;left:0;width:${size}px;height:${size}px;border-bottom:${w} solid ${color};border-left:${w} solid ${color};"></div>
    <div style="position:absolute;bottom:0;right:0;width:${size}px;height:${size}px;border-bottom:${w} solid ${color};border-right:${w} solid ${color};"></div>
  `;
}

function pdfLogoImg(src: string, alt: string, className: string): string {
  const isExternal = src.startsWith('http') && !src.startsWith(window.location.origin);
  const corsAttr = isExternal ? ' crossorigin="anonymous"' : '';
  const hideOnError = ' onerror="this.style.display=\'none\'"';
  return `<img src="${src}" alt="${escapeHtml(alt)}" class="${className}"${corsAttr}${hideOnError} />`;
}

function resolveAbsoluteUrl(src: string): string {
  if (src.startsWith('data:') || src.startsWith('http')) return src;
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '/');
  return new URL(src.replace(/^\//, ''), base).href;
}

/** Hide broken images so alt icons never appear in preview/PDF. */
export function wirePdfImageFallbacks(root: HTMLElement): void {
  root.querySelectorAll('img').forEach((img) => {
    const hide = () => {
      img.style.display = 'none';
    };
    img.addEventListener('error', hide, { once: true });
    if (img.complete && img.naturalWidth === 0) {
      hide();
    }
  });
}

function buildAuthorInfoHtml(
  estimate: Estimate,
  signature?: PdfExportOptions['signature']
): string {
  const name = signature?.fullName?.trim() || estimate.createdByName?.trim() || '';
  const position = signature?.position?.trim() || '';
  if (!name && !position) return '';
  const label =
    name && position ? `${name}, ${position}` : name || position;
  return `<div class="kp-author-info">Составил: ${escapeHtml(label)}</div>`;
}

function buildPageHeaderHtml(
  estimate: Estimate,
  clientLogoSrc: string | null,
  signature?: PdfExportOptions['signature']
): string {
  const aversLogo = resolveAbsoluteUrl(AVERS_LOGO);
  const clientLogo = clientLogoSrc ? resolveAbsoluteUrl(clientLogoSrc) : null;
  const clientName = estimate.clientName?.trim() || '—';
  const authorHtml = buildAuthorInfoHtml(estimate, signature);

  const clientLogoImg = clientLogo
    ? pdfLogoImg(clientLogo, clientName, 'client-logo-pdf')
    : '';

  return `
    <div class="pdf-header">
      <div class="pdf-document-title-row">
        <h1 class="pdf-main-title">Коммерческое предложение</h1>
        <span class="pdf-doc-date">от ${formatDate(estimate.updatedAt)}</span>
      </div>
      <div class="pdf-header-divider"></div>
      <div class="pdf-parties-row">
        <div class="pdf-header-column left">
          <span class="column-meta-label">ОТПРАВИТЕЛЬ:</span>
          <div class="brand-info-block">
            <div class="logo-wrapper-pdf">
              ${pdfLogoImg(aversLogo, 'Avers Technology', 'brand-logo-pdf')}
            </div>
            <div class="company-name-pdf">ООО «Аверс Технолоджи»</div>
            ${authorHtml}
          </div>
        </div>
        <div class="pdf-header-column right">
          <span class="column-meta-label">ПОДГОТОВЛЕНО ДЛЯ:</span>
          <div class="brand-info-block">
            <div class="logo-wrapper-pdf">${clientLogoImg}</div>
            <div class="company-name-pdf">${escapeHtml(clientName)}</div>
          </div>
          <div class="project-meta-pdf">
            <span class="project-label">Проект:</span>
            <span class="project-highlight">${escapeHtml(estimate.projectName)}</span>
          </div>
        </div>
      </div>
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
          ${cornerFrameHtml(card.accent)}
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
    <div class="pdf-estimation-details-header">
      <h2 class="pdf-section-title">Детализация сметы</h2>
      <div class="pdf-section-accent"></div>
    </div>
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
      <div class="pdf-grand-totals__final">Итого с НДС: <strong>${formatCurrency(totals.totalWithVat)}</strong></div>
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
  const descriptionText = estimate.description?.trim() ?? '';
  const descriptionBlock = descriptionText
    ? `<div class="pdf-description-block">
        <h2 class="pdf-description-title">Описание проекта</h2>
        <p class="pdf-description">${escapeHtml(descriptionText)}</p>
      </div>`
    : '';

  const embeddedMarketing = buildEmbeddedMarketingSlidesHtml(estimate, options);
  const embeddedContacts = buildEmbeddedContactsBlockHtml(estimate, options);

  return `
    <div class="pdf-page pdf-page--document">
      ${buildPageHeaderHtml(estimate, clientLogoSrc, options.signature)}
      ${embeddedMarketing}
      ${descriptionBlock}
      ${buildSummaryCardsHtml(totals)}
      ${buildTableHtml(estimate)}
      ${buildGrandTotalsHtml(totals)}
      ${buildSignatureBlockHtml(estimate, options.signature)}
      ${embeddedContacts}
      ${buildFooterHtml()}
    </div>
  `;
}

function resolveSlidesLibrary(options: PdfExportOptions): PresentationSlidesLibrary {
  return options.slidesLibrary ?? createDefaultSlidesLibrary();
}

/** Marketing slides as compact widgets after the KP header (before summary cards). */
export function buildEmbeddedMarketingSlidesHtml(
  estimate: Estimate,
  options: PdfExportOptions = {}
): string {
  const selected = estimate.presentationSlides;
  if (!selected) return '';

  const library = resolveSlidesLibrary(options);
  const parts: string[] = [];
  if (selected.about) parts.push(buildEmbeddedStandardSlideHtml('about', library.about));
  if (selected.recognition) {
    parts.push(buildEmbeddedStandardSlideHtml('recognition', library.recognition));
  }
  if (selected.kiosk) parts.push(buildEmbeddedStandardSlideHtml('kiosk', library.kiosk));
  return parts.join('');
}

/** Contacts slide as a compact closing block before signatures. */
export function buildEmbeddedContactsBlockHtml(
  estimate: Estimate,
  options: PdfExportOptions = {}
): string {
  if (estimate.presentationSlides?.contacts !== true) return '';
  const library = resolveSlidesLibrary(options);
  return buildEmbeddedContactsSlideHtml(library.contacts);
}

/** @deprecated Landscape slide pages removed — slides are embedded in the A4 document. */
export function buildPresentationSlidesHtml(
  estimate: Estimate,
  options: PdfExportOptions = {}
): string {
  return buildEmbeddedMarketingSlidesHtml(estimate, options);
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

async function renderPageToPdf(
  pdf: jsPDF,
  pageEl: HTMLElement,
  options: { isFirstPage: boolean; landscape: boolean; captureWidth: number }
): Promise<void> {
  if (!options.isFirstPage) {
    pdf.addPage('a4', options.landscape ? 'landscape' : 'portrait');
  }

  const canvas = await html2canvas(pageEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    width: options.captureWidth,
    windowWidth: options.captureWidth,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  if (!options.landscape && imgHeight > pdfHeight) {
    let remaining = imgHeight;
    let srcY = 0;
    const pageCanvasHeight = (pdfHeight * canvas.width) / pdfWidth;
    let sliceIndex = 0;

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

      if (sliceIndex > 0) pdf.addPage('a4', 'portrait');
      pdf.addImage(sliceData, 'PNG', 0, 0, pdfWidth, slicePdfHeight);

      srcY += sliceHeight;
      remaining -= slicePdfHeight;
      sliceIndex += 1;
    }
    return;
  }

  const drawHeight = Math.min(imgHeight, pdfHeight);
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, drawHeight);
}

export async function exportToPdf(estimate: Estimate, options: PdfExportOptions = {}): Promise<void> {
  const slidesLibrary = options.slidesLibrary ?? (await loadPresentationSlidesLibrary());
  const resolvedOptions: PdfExportOptions = { ...options, slidesLibrary };

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px';
  container.style.background = '#fff';

  const styleEl = document.createElement('style');
  styleEl.textContent = pdfStyles();
  container.appendChild(styleEl);
  container.insertAdjacentHTML('beforeend', buildPdfHtml(estimate, resolvedOptions));
  wirePdfImageFallbacks(container);

  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const documentPage = container.querySelector<HTMLElement>('.pdf-page--document');
    if (!documentPage) return;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4',
    });

    await renderPageToPdf(pdf, documentPage, {
      isFirstPage: true,
      landscape: false,
      captureWidth: 794,
    });

    const safeName = estimate.projectName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '').trim() || 'kp';
    pdf.save(`КП_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
