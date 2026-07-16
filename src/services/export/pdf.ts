import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Estimate, StandardLineItem } from '../../types';
import { ROLES } from '../../constants/roles';
import { getCopyrightYear, getVersionLabel } from '../../constants/version';
import {
  calculateSectionTotals,
  calculateEstimateTotals,
  formatCurrency,
  formatDate,
  formatNumber,
} from '../../utils/calculator';
import {
  calculateLineTotal,
  calculateStandardTotals,
  formatStandardLineCost,
} from '../../utils/standardCalculator';
import { isStandardEstimate } from '../../utils/estimateFactory';
import { AVERS_LOGO } from '../../utils/clientLogo';
import { loadThemeColors } from '../../utils/personalization';
import { loadPresentationSlidesLibrary } from '../presentationSlides';
import { buildEmbeddedStandardSlideHtml, buildUnifiedFooterSectionHtml, embeddedSlideCss } from '../../components/slides/slideTemplate';
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
      border-bottom: 1.5px solid #f1f5f9;
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
    .kp-header-section {
      width: 100%;
      margin-top: 20px;
      margin-bottom: 25px;
    }
    .header-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      align-items: start;
    }
    .header-column-sender,
    .header-column-recipient {
      min-width: 0;
    }
    .header-meta-label {
      font-family: inherit;
      font-size: 10px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
      margin-bottom: 12px;
    }
    .brand-logo-wrapper,
    .recipient-logo-wrapper {
      height: 36px;
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .brand-logo {
      height: 28px;
      width: auto;
      max-width: 200px;
      object-fit: contain;
    }
    .recipient-logo {
      height: 22px;
      width: auto;
      max-width: 200px;
      object-fit: contain;
    }
    .company-title {
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
      line-height: 1.3;
    }
    .company-subtitle {
      font-family: inherit;
      font-size: 11px;
      font-weight: 500;
      color: #64748b;
      line-height: 1.4;
    }
    .company-subtitle .highlight-text {
      color: #334155;
      font-weight: 600;
    }
    .header-column-recipient {
      text-align: right;
    }
    .header-column-recipient .recipient-logo-wrapper {
      justify-content: flex-end;
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
      display: inline-block;
      max-width: 100%;
      vertical-align: top;
    }
    .pdf-section-title {
      font-size: 15px;
      font-weight: 700;
      color: ${c.text};
      text-transform: uppercase;
      margin: 0 0 4px;
    }
    .pdf-section-accent {
      width: 100%;
      height: 1.5px;
      background: ${c.accent};
      margin-bottom: 0;
    }

    /* Иерархия заголовков: Спецификация (H2) — как .embedded-slide-title */
    .specification-main-heading {
      display: inline-block;
      max-width: 100%;
      margin: 32px 0 24px;
      vertical-align: top;
    }
    .specification-main-title {
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0;
      color: #0f172a;
      margin: 0 0 4px;
      line-height: 1.2;
      padding-bottom: 0;
    }
    /* Как .embedded-slide-accent / .pdf-section-accent */
    .specification-main-accent {
      width: 100%;
      height: 1.5px;
      background: ${c.accent};
    }
    .section-sub-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px !important;
      font-weight: 700 !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #334155;
      margin: 24px 0 12px;
    }
    .section-sub-title .icon {
      opacity: 0.75;
      filter: grayscale(10%);
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 14px;
      line-height: 1;
    }
    .specification-main-heading + .estimate-section .section-sub-title,
    .specification-main-heading + .section-sub-title {
      margin-top: 0;
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
      border-top: 1.5px solid ${c.accent};
    }
    .pdf-table .total-row td {
      padding: 7px 6px;
      font-weight: 700;
      font-size: 10px;
      background: ${TOTAL_ROW_BG};
      color: ${c.accent};
      border-bottom: 1.5px solid ${c.accent};
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
      border-top: 1.5px solid ${c.accent};
    }
    .pdf-grand-totals__final strong {
      color: ${c.accent};
    }

    /* Standard estimate: structured total summary */
    .summary-wrapper {
      margin-top: 40px;
      margin-bottom: 32px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      width: 100%;
      page-break-inside: avoid;
    }
    .summary-group {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-group.recurring-group {
      margin-top: 24px;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      width: 100%;
    }
    .summary-row.sub {
      font-size: 10pt;
      color: #64748b;
    }
    .summary-row.sub .summary-value {
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
    }
    .summary-divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 8px 0;
      width: 100%;
    }
    .summary-row.main-total {
      margin-top: 4px;
      margin-bottom: 4px;
    }
    .summary-label-total {
      font-size: 9pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .summary-value-total {
      font-size: 16pt;
      font-weight: 800;
      white-space: nowrap;
    }
    .text-red {
      color: #ef4444;
    }
    .summary-row.main-total-recurring {
      background-color: #f8fafc;
      border-left: 3px solid #2563eb;
      padding: 10px 14px;
      border-radius: 0 6px 6px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .summary-label-recurring {
      font-size: 8.5pt;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: 0.5px;
    }
    .summary-value-recurring {
      font-size: 13pt;
      font-weight: 800;
      white-space: nowrap;
    }
    .text-blue {
      color: #2563eb;
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

    /* --- Типовая смета: спецификация ПО / Услуги --- */
    .spec-table {
      width: 100%;
      border-collapse: collapse;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      margin-bottom: 8px;
      table-layout: fixed;
    }
    .spec-table col.col-num { width: 5%; }
    .spec-table col.col-name { width: 43%; }
    .spec-table col.col-type { width: 14%; }
    .spec-table col.col-price { width: 13%; }
    .spec-table col.col-qty { width: 10%; }
    .spec-table col.col-total { width: 15%; }
    .spec-table th {
      background-color: #f8fafc;
      color: #475569;
      font-size: 7.5pt !important;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      white-space: nowrap;
      padding: 8px 6px !important;
      border-bottom: 1.5px solid #e2e8f0;
      text-align: left;
    }
    .spec-table td {
      padding: 12px 14px;
      font-size: 9.5pt;
      color: #334155;
      border-bottom: 1px solid #f1f5f9;
      vertical-align: top;
    }
    .spec-table td:last-child,
    .spec-table th:last-child {
      text-align: right !important;
      padding-right: 12px !important;
    }
    .spec-table tbody tr { page-break-inside: avoid; }
    .col-num { text-align: center; color: #94a3b8; font-weight: 700; }
    .col-name { }
    .col-type { }
    .col-price { text-align: right; white-space: nowrap; }
    .col-qty { text-align: center; }
    .col-total { text-align: right; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .spec-table th.col-num,
    .spec-table th.col-qty { text-align: center; }
    .spec-table th.col-price,
    .spec-table th.col-total { text-align: right; }
    .item-name {
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 3px;
      line-height: 1.35;
    }
    .item-note {
      font-size: 8pt;
      color: #ef4444;
      font-style: italic;
      margin: 2px 0;
      padding-left: 6px;
      border-left: 1.5px solid #ef4444;
      line-height: 1.35;
    }
    .item-desc {
      font-size: 8pt;
      color: #64748b;
      line-height: 1.35;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 7.5pt;
      font-weight: 700;
      border-radius: 12px;
      white-space: nowrap;
    }
    .badge-buy { background-color: #f0fdf4; color: #15803d; }
    .badge-rent { background-color: #eff6ff; color: #1d4ed8; }
    .badge-service { background-color: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
    .subtotal-row { background-color: #f8fafc; }
    .subtotal-row td {
      font-weight: 700;
      border-top: 1.5px solid #e2e8f0;
      border-bottom: none;
      padding: 12px 14px;
      vertical-align: middle;
    }
    .pdf-subtotal-labels {
      text-align: right;
      line-height: 1.5;
      white-space: nowrap;
    }
    .pdf-subtotal-values {
      text-align: right;
      line-height: 1.5;
      white-space: nowrap;
      padding-right: 0;
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
  if (!src) return src;
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;
  if (/^https?:\/\//i.test(src)) return src;
  // Vite BASE_URL paths already include the deploy prefix (e.g. /avers-sales-doc/logos/...).
  // Resolve against origin only — never against pathname, or the prefix is doubled in prod.
  if (src.startsWith('/')) {
    return `${window.location.origin}${src}`;
  }
  return new URL(src, `${window.location.origin}${import.meta.env.BASE_URL}`).href;
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
  const escapedName = name ? `<span class="highlight-text">${escapeHtml(name)}</span>` : '';
  const suffix = position ? `${name ? ', ' : ''}${escapeHtml(position)}` : '';
  return `<div class="company-subtitle">Составил: ${escapedName}${suffix}</div>`;
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
    ? pdfLogoImg(clientLogo, clientName, 'recipient-logo')
    : '';

  return `
    <div class="pdf-header">
      <div class="pdf-document-title-row">
        <h1 class="pdf-main-title">Коммерческое предложение</h1>
        <span class="pdf-doc-date">от ${formatDate(estimate.updatedAt)}</span>
      </div>
      <div class="pdf-header-divider"></div>
      <div class="kp-header-section">
        <div class="header-columns">
          <div class="header-column-sender">
            <span class="header-meta-label">Отправитель</span>
            <div class="brand-logo-wrapper">
              ${pdfLogoImg(aversLogo, 'Avers Technology', 'brand-logo')}
            </div>
            <div class="company-title">ООО «Аверс Технолоджи»</div>
            ${authorHtml}
          </div>
          <div class="header-column-recipient">
            <span class="header-meta-label">Подготовлено для</span>
            <div class="recipient-logo-wrapper">${clientLogoImg}</div>
            <div class="company-title">${escapeHtml(clientName)}</div>
            <div class="company-subtitle">Проект: <span class="highlight-text">${escapeHtml(estimate.projectName)}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildStandardSummaryCardsHtml(
  totals: ReturnType<typeof calculateStandardTotals>
): string {
  const vatLabel = `${Math.round(totals.vatRate * 100)}%`;
  const cards = [
    { label: 'Единоразово (с НДС)', value: formatCurrency(totals.oneTimeWithVat), accent: true },
    { label: 'Аренда / месяц', value: `${formatCurrency(totals.recurringMonthly)} / мес.`, accent: false },
    { label: `НДС (${vatLabel})`, value: formatCurrency(totals.vat), accent: false },
    { label: 'Всего позиций', value: String(totals.itemCount), accent: false },
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

function paymentBadgeHtml(item: StandardLineItem): string {
  if (item.paymentScheme === 'rent') {
    return `<span class="badge badge-rent">Аренда</span>`;
  }
  if (item.paymentScheme === 'buyout') {
    return `<span class="badge badge-buy">Выкуп</span>`;
  }
  return `<span class="badge badge-service">Фикс. оплата</span>`;
}

function pdfSubtotalHtml(oneTime: number, recurring = 0): string {
  let labels = '';
  let values = '';

  if (oneTime > 0 && recurring > 0) {
    labels = `
      <div style="font-size: 8pt; color: #64748b; font-weight: bold;">ИТОГО К ОПЛАТЕ (ЕДИНОРАЗОВО):</div>
      <div style="font-size: 8pt; color: #2563eb; font-weight: bold; margin-top: 3px;">ИТОГО АРЕНДА (ЕЖЕМЕСЯЧНО):</div>
    `;
    values = `
      <div style="font-size: 9.5pt; font-weight: 800; color: #0f172a;">${formatCurrency(oneTime)}</div>
      <div style="font-size: 9pt; font-weight: 800; color: #2563eb; margin-top: 3px;">${formatCurrency(recurring)} / мес.</div>
    `;
  } else if (oneTime > 0) {
    labels = `<div style="font-size: 8pt; color: #64748b; font-weight: bold;">ИТОГО ПО РАЗДЕЛУ:</div>`;
    values = `<div style="font-size: 9.5pt; font-weight: 800; color: #0f172a;">${formatCurrency(oneTime)}</div>`;
  } else if (recurring > 0) {
    labels = `<div style="font-size: 8pt; color: #2563eb; font-weight: bold;">ИТОГО АРЕНДА (ЕЖЕМЕСЯЧНО):</div>`;
    values = `<div style="font-size: 9.5pt; font-weight: 800; color: #2563eb;">${formatCurrency(recurring)} / мес.</div>`;
  } else {
    labels = `<div style="font-size: 8pt; color: #64748b; font-weight: bold;">ИТОГО ПО РАЗДЕЛУ:</div>`;
    values = `<div style="font-size: 9.5pt; font-weight: 800; color: #0f172a;">${formatCurrency(0)}</div>`;
  }

  return `
    <tr class="subtotal-row">
      <td colspan="5" style="text-align: right; padding-right: 12px; vertical-align: middle;">
        <div class="pdf-subtotal-labels">${labels}</div>
      </td>
      <td style="text-align: right; vertical-align: middle; padding-right: 12px;">
        <div class="pdf-subtotal-values">${values}</div>
      </td>
    </tr>
  `;
}

function buildStandardSpecRowsHtml(items: StandardLineItem[]): string {
  return items
    .map((item, index) => {
      const note = item.note?.trim()
        ? `<div class="item-note">* Примечание: ${escapeHtml(item.note.trim())}</div>`
        : '';
      const desc = item.description.trim()
        ? `<div class="item-desc">${escapeHtml(item.description)}</div>`
        : '';
      return `
        <tr>
          <td class="col-num">${index + 1}</td>
          <td class="col-name">
            <div class="item-name">${escapeHtml(item.name)}</div>
            ${note}
            ${desc}
          </td>
          <td class="col-type">${paymentBadgeHtml(item)}</td>
          <td class="col-price">${formatCurrency(item.unitPrice)}</td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-total">${formatStandardLineCost(item)}</td>
        </tr>`;
    })
    .join('');
}

function buildStandardSpecTableHtml(
  title: string,
  icon: string,
  items: StandardLineItem[],
  oneTime: number,
  recurring = 0
): string {
  const body =
    items.length === 0
      ? `<tr><td colspan="6" style="text-align:center;color:#94a3b8;padding:16px;">Нет позиций</td></tr>`
      : buildStandardSpecRowsHtml(items);

  return `
    <h3 class="section-sub-title"><span class="icon">${icon}</span> ${title}</h3>
    <table class="spec-table">
      <colgroup>
        <col class="col-num" />
        <col class="col-name" />
        <col class="col-type" />
        <col class="col-price" />
        <col class="col-qty" />
        <col class="col-total" />
      </colgroup>
      <thead>
        <tr>
          <th class="col-num">№</th>
          <th class="col-name">Наименование</th>
          <th class="col-type">Тип оплаты</th>
          <th class="col-price">Цена за ед.</th>
          <th class="col-qty">Кол-во</th>
          <th class="col-total">Стоимость</th>
        </tr>
      </thead>
      <tbody>${body}</tbody>
      <tfoot>
        ${pdfSubtotalHtml(oneTime, recurring)}
      </tfoot>
    </table>
  `;
}

function buildStandardTableHtml(estimate: Estimate): string {
  const items = estimate.standardItems ?? [];
  const software = items.filter((i) => i.kind === 'software');
  const hardware = items.filter((i) => i.kind === 'hardware');
  const services = items.filter((i) => i.kind === 'service');

  let softwareOneTime = 0;
  let softwareRent = 0;
  for (const item of software) {
    const total = calculateLineTotal(item);
    if (item.paymentScheme === 'rent') softwareRent += total;
    else softwareOneTime += total;
  }
  const hardwareTotal = hardware.reduce((sum, item) => sum + calculateLineTotal(item), 0);
  const servicesTotal = services.reduce((sum, item) => sum + calculateLineTotal(item), 0);

  return `
    <div class="specification-main-heading">
      <h2 class="specification-main-title">Спецификация</h2>
      <div class="specification-main-accent"></div>
    </div>
    ${buildStandardSpecTableHtml(
      'Программное обеспечение',
      '💿',
      software,
      softwareOneTime,
      softwareRent
    )}
    ${buildStandardSpecTableHtml(
      'Оборудование и комплектующие',
      '🔌',
      hardware,
      hardwareTotal
    )}
    ${buildStandardSpecTableHtml(
      'Услуги и работы',
      '🔧',
      services,
      servicesTotal
    )}
  `;
}

function buildStandardGrandTotalsHtml(totals: ReturnType<typeof calculateStandardTotals>): string {
  const vatLabel = `${Math.round(totals.vatRate * 100)}%`;
  const recurringGroup =
    totals.recurringMonthly > 0
      ? `
      <div class="summary-group recurring-group">
        <div class="summary-row main-total-recurring">
          <span class="summary-label-recurring">ИТОГО АРЕНДА (ЕЖЕМЕСЯЧНО):</span>
          <span class="summary-value-recurring text-blue">${formatCurrency(totals.recurringMonthly)} / мес.</span>
        </div>
      </div>`
      : '';

  return `
    <div class="summary-wrapper">
      <div class="summary-group one-time-group">
        <div class="summary-row sub">
          <span class="summary-label">Единоразово без НДС:</span>
          <span class="summary-value">${formatCurrency(totals.oneTimeSubtotal)}</span>
        </div>
        <div class="summary-row sub">
          <span class="summary-label">НДС ${vatLabel}:</span>
          <span class="summary-value">${formatCurrency(totals.vat)}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row main-total">
          <span class="summary-label-total">ИТОГО К ОПЛАТЕ (ЕДИНОРАЗОВО):</span>
          <span class="summary-value-total text-red">${formatCurrency(totals.oneTimeWithVat)}</span>
        </div>
      </div>
      ${recurringGroup}
    </div>
  `;
}

function buildStandardDocumentPage(estimate: Estimate, options: PdfExportOptions): string {
  const totals = calculateStandardTotals(estimate.standardItems ?? [], estimate.vatRate ?? 0.05);

  const clientLogoSrc = options.clientLogoSrc ?? null;
  const descriptionText = estimate.description?.trim() ?? '';
  const descriptionBlock = descriptionText
    ? `<div class="pdf-description-block">
        <h2 class="pdf-description-title">Описание проекта</h2>
        <p class="pdf-description">${escapeHtml(descriptionText)}</p>
      </div>`
    : '';

  const embeddedMarketing = buildEmbeddedMarketingSlidesHtml(estimate, options);

  return `
    <div class="pdf-page pdf-page--document">
      ${buildPageHeaderHtml(estimate, clientLogoSrc, options.signature)}
      ${embeddedMarketing}
      ${descriptionBlock}
      ${buildStandardSummaryCardsHtml(totals)}
      ${buildStandardTableHtml(estimate)}
      ${buildStandardGrandTotalsHtml(totals)}
      ${buildUnifiedFooterBlockHtml(estimate, options)}
      ${buildFooterHtml()}
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

function buildUnifiedFooterBlockHtml(
  estimate: Estimate,
  options: PdfExportOptions
): string {
  const library = resolveSlidesLibrary(options);
  const contacts =
    estimate.presentationSlides?.contacts === true ? library.contacts : null;

  return buildUnifiedFooterSectionHtml(
    {
      signerName: options.signature?.fullName?.trim() ?? '',
      signerPosition: options.signature?.position?.trim() ?? '',
      clientName: estimate.clientName ?? '',
    },
    contacts
  );
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
    <div class="summary-wrapper">
      <div class="summary-group one-time-group">
        <div class="summary-row sub">
          <span class="summary-label">Итого без НДС:</span>
          <span class="summary-value">${formatCurrency(totals.subtotal)}</span>
        </div>
        <div class="summary-row sub">
          <span class="summary-label">НДС 5%:</span>
          <span class="summary-value">${formatCurrency(totals.vat)}</span>
        </div>
        <div class="summary-divider"></div>
        <div class="summary-row main-total">
          <span class="summary-label-total">ИТОГО К ОПЛАТЕ:</span>
          <span class="summary-value-total text-red">${formatCurrency(totals.totalWithVat)}</span>
        </div>
      </div>
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

  return `
    <div class="pdf-page pdf-page--document">
      ${buildPageHeaderHtml(estimate, clientLogoSrc, options.signature)}
      ${embeddedMarketing}
      ${descriptionBlock}
      ${buildSummaryCardsHtml(totals)}
      ${buildTableHtml(estimate)}
      ${buildGrandTotalsHtml(totals)}
      ${buildUnifiedFooterBlockHtml(estimate, options)}
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

  const customById = new Map((library.customSlides ?? []).map((slide) => [slide.id, slide]));
  for (const id of selected.customIds ?? []) {
    const slide = customById.get(id);
    if (!slide) continue;
    parts.push(
      buildEmbeddedStandardSlideHtml(slide.id, slide.content, slide.defaultImageFile)
    );
  }

  return parts.join('');
}

/** @deprecated Slides are embedded in the unified footer section. */
export function buildEmbeddedContactsBlockHtml(
  estimate: Estimate,
  options: PdfExportOptions = {}
): string {
  return buildUnifiedFooterBlockHtml(estimate, options);
}

/** @deprecated Landscape slide pages removed — slides are embedded in the A4 document. */
export function buildPresentationSlidesHtml(
  estimate: Estimate,
  options: PdfExportOptions = {}
): string {
  return buildEmbeddedMarketingSlidesHtml(estimate, options);
}

export function buildPdfHtml(estimate: Estimate, options: PdfExportOptions = {}): string {
  if (isStandardEstimate(estimate)) {
    return buildStandardDocumentPage(estimate, options);
  }
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
