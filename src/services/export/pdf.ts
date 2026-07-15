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
import { ensurePresentationSlideAssets } from '../presentationSlides';

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
  /** Resolved slide images (defaults + Firestore overrides). */
  slideAssets?: {
    aboutImageSrc: string;
    recognitionImageSrc: string;
    qrImageSrc: string;
    aboutIsCustom?: boolean;
    recognitionIsCustom?: boolean;
  };
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
      justify-content: space-between;
      align-items: stretch;
      gap: 32px;
      border-bottom: 1px solid ${c.border};
      padding-bottom: 24px;
      margin-bottom: 24px;
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
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 12px;
      display: block;
    }
    .brand-info-block {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
    }
    .pdf-header-column.left .brand-info-block {
      align-items: flex-start;
    }
    .pdf-header-column.right .brand-info-block {
      align-items: flex-end;
    }
    .logo-wrapper-pdf {
      height: 32px;
      display: flex;
      align-items: center;
      margin-bottom: 8px;
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
    .document-meta-pdf {
      margin-top: auto;
      display: flex;
      flex-direction: column;
    }
    .pdf-header-column.left .document-meta-pdf {
      align-items: flex-start;
    }
    .pdf-header-column.right .document-meta-pdf {
      align-items: flex-end;
    }
    .pdf-main-title {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      text-transform: none;
      letter-spacing: -0.2px;
      margin: 0 0 2px;
      line-height: 1.3;
    }
    .pdf-doc-date {
      font-size: 12px;
      color: ${c.textMuted};
      margin: 0;
    }
    .pdf-project-title {
      font-size: 14px;
      font-weight: 400;
      color: ${c.textMuted};
      margin: 4px 0 0;
      line-height: 1.3;
    }
    .project-highlight {
      color: #0f172a;
      font-weight: 600;
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
      color: ${c.accent};
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
      margin: 0 0 20px;
      page-break-inside: avoid;
    }
    .pdf-description-title {
      font-size: 13px;
      font-weight: 700;
      color: ${c.text};
      margin: 0 0 8px;
    }
    .pdf-description {
      margin: 0;
      font-size: 11px;
      line-height: 1.5;
      color: ${c.textMuted};
    }

    /* Presentation slides (KP constructor) */
    .pdf-page-slide {
      width: 1123px;
      height: 794px;
      position: relative;
      box-sizing: border-box;
      padding: 56px 72px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: center;
      overflow: hidden;
      font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
    }
    .slide-decor-top-left,
    .slide-decor-bottom-right {
      position: absolute;
      width: 36px;
      height: 36px;
      pointer-events: none;
    }
    .slide-decor-top-left {
      top: 28px;
      left: 28px;
      background: #0052cc;
      box-shadow: 10px 10px 0 0 #0f172a;
    }
    .slide-decor-bottom-right {
      bottom: 28px;
      right: 28px;
      background: #0052cc;
      box-shadow: -10px -10px 0 0 #0f172a;
    }
    .slide-title {
      font-size: 26px;
      font-weight: 800;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 12px 0;
      letter-spacing: -0.4px;
      line-height: 1.15;
    }
    .slide-divider {
      height: 3px;
      background: #0052cc;
      width: 100%;
      margin-bottom: 22px;
      position: relative;
    }
    .slide-divider::before {
      content: '';
      position: absolute;
      left: 0;
      top: -4px;
      width: 10px;
      height: 10px;
      background: #0052cc;
    }
    .slide-content-grid {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      gap: 36px;
      align-items: center;
      flex: 1;
      min-height: 0;
    }
    .slide-text-col {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .slide-lead {
      font-size: 14px;
      line-height: 1.55;
      color: #334155;
      margin: 0 0 18px 0;
    }
    .slide-sub-title,
    .slide-product-name {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin: 0 0 12px 0;
    }
    .slide-list-items {
      padding-left: 18px;
      margin: 0;
      list-style: disc;
    }
    .slide-list-items li {
      font-size: 13px;
      color: #334155;
      margin-bottom: 7px;
      line-height: 1.4;
    }
    .slide-image-col {
      height: 360px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .slide-image-frame {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .slide-image-frame__corner {
      position: absolute;
      width: 22px;
      height: 22px;
      z-index: 2;
    }
    .slide-image-frame__corner--tl {
      top: -8px;
      left: -8px;
      background: #0052cc;
    }
    .slide-image-frame__corner--br {
      bottom: -8px;
      right: -8px;
      background: #0052cc;
    }
    .slide-image-frame__bracket {
      position: absolute;
      width: 28px;
      height: 28px;
      z-index: 2;
    }
    .slide-image-frame__bracket--tr {
      top: -6px;
      right: -6px;
      border-top: 3px solid #0f172a;
      border-right: 3px solid #0f172a;
    }
    .slide-image-frame__bracket--bl {
      bottom: -6px;
      left: -6px;
      border-bottom: 3px solid #0f172a;
      border-left: 3px solid #0f172a;
    }
    .slide-img-placeholder {
      width: 100%;
      height: 100%;
      background-color: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .slide-img-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    /* Crop default mockup slides to the photo region on the right */
    .slide-img-photo--dev-default {
      object-position: 92% 48%;
      transform: scale(2.35);
      transform-origin: 92% 48%;
      filter: grayscale(1) contrast(1.05);
    }
    .slide-img-photo--kiosk-default {
      object-position: 88% 45%;
      transform: scale(2.1);
      transform-origin: 88% 45%;
    }
    .slide-badge-ai {
      display: inline-block;
      align-self: flex-start;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #166534;
      padding: 7px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 12px;
      line-height: 1.35;
      max-width: 92%;
    }
    .slide-disclaimer {
      font-size: 10px;
      color: #94a3b8;
      font-style: italic;
      margin: -12px 0 16px 0;
      line-height: 1.35;
    }
    .qr-code-block {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 22px;
      padding: 10px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      max-width: 340px;
    }
    .qr-placeholder {
      width: 64px;
      height: 64px;
      border: 1px solid #86efac;
      border-radius: 6px;
      background: #fff;
      padding: 3px;
      flex-shrink: 0;
      box-sizing: border-box;
    }
    .qr-placeholder img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .qr-code-block p {
      font-size: 11px;
      color: #166534;
      line-height: 1.35;
      margin: 0;
    }
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

function buildPageHeaderHtml(estimate: Estimate, clientLogoSrc: string | null): string {
  const aversLogo = resolveAbsoluteUrl(AVERS_LOGO);
  const clientLogo = clientLogoSrc ? resolveAbsoluteUrl(clientLogoSrc) : null;
  const clientName = estimate.clientName?.trim() || '—';

  const clientLogoImg = clientLogo
    ? pdfLogoImg(clientLogo, clientName, 'client-logo-pdf')
    : '';

  return `
    <div class="pdf-header">
      <div class="pdf-header-column left">
        <span class="column-meta-label">ОТПРАВИТЕЛЬ:</span>
        <div class="brand-info-block">
          <div class="logo-wrapper-pdf">
            ${pdfLogoImg(aversLogo, 'Avers Technology', 'brand-logo-pdf')}
          </div>
          <div class="company-name-pdf">ООО «Аверс Технолоджи»</div>
        </div>
        <div class="document-meta-pdf">
          <h1 class="pdf-main-title">Коммерческое предложение</h1>
          <p class="pdf-doc-date">от ${formatDate(estimate.updatedAt)}</p>
        </div>
      </div>
      <div class="pdf-header-column right">
        <span class="column-meta-label">ПОДГОТОВЛЕНО ДЛЯ:</span>
        <div class="brand-info-block">
          <div class="logo-wrapper-pdf">${clientLogoImg}</div>
          <div class="company-name-pdf">${escapeHtml(clientName)}</div>
        </div>
        <div class="document-meta-pdf">
          <h2 class="pdf-project-title">Проект: <span class="project-highlight">${escapeHtml(estimate.projectName)}</span></h2>
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

  return `
    <div class="pdf-page pdf-page--document">
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

function resolveSlideAssetsForPdf(options: PdfExportOptions) {
  if (options.slideAssets) return options.slideAssets;
  // Lazy import avoided — callers should pass slideAssets after ensurePresentationSlideAssets().
  return {
    aboutImageSrc: resolveAbsoluteUrl(`${import.meta.env.BASE_URL}assets/slides/dev-team.png`),
    recognitionImageSrc: resolveAbsoluteUrl(
      `${import.meta.env.BASE_URL}assets/slides/smart-kassa.png`
    ),
    qrImageSrc: resolveAbsoluteUrl(`${import.meta.env.BASE_URL}assets/slides/qr-video.png`),
    aboutIsCustom: false,
    recognitionIsCustom: false,
  };
}

function buildAboutSlideHtml(options: PdfExportOptions): string {
  const assets = resolveSlideAssetsForPdf(options);
  const aboutSrc = resolveAbsoluteUrl(assets.aboutImageSrc);
  const photoClass = assets.aboutIsCustom
    ? 'slide-img-photo'
    : 'slide-img-photo slide-img-photo--dev-default';

  return `
    <div class="pdf-page pdf-page-slide" id="pdf-slide-about-view" data-slide="about">
      <div class="slide-decor-top-left"></div>
      <div class="slide-decor-bottom-right"></div>

      <h2 class="slide-title">Команда разработки Аверс Технолоджи</h2>
      <div class="slide-divider"></div>

      <div class="slide-content-grid">
        <div class="slide-text-col">
          <p class="slide-lead">Наша компания специализируется на разработке информационных систем для сферы общепита и автоматизации ритейла. Мы обладаем глубокой экспертизой и готовы реализовать проект любой сложности.</p>

          <h3 class="slide-sub-title">Наши решения:</h3>
          <ul class="slide-list-items">
            <li>Кассовый модуль для кассиров и POS-системы</li>
            <li>Личный кабинет гостя и программы лояльности</li>
            <li>WEB-приложения для онлайн-заказа блюд</li>
            <li>Система распознавания еды в столовых на базе AI</li>
            <li>Интерактивные киоски самообслуживания</li>
            <li>Системы анализа обратной связи на основе ИИ</li>
          </ul>
        </div>

        <div class="slide-image-col">
          <div class="slide-image-frame">
            <div class="slide-image-frame__corner slide-image-frame__corner--tl"></div>
            <div class="slide-image-frame__bracket slide-image-frame__bracket--tr"></div>
            <div class="slide-image-frame__bracket slide-image-frame__bracket--bl"></div>
            <div class="slide-image-frame__corner slide-image-frame__corner--br"></div>
            <div class="slide-img-placeholder">
              <img class="${photoClass}" src="${aboutSrc}" alt="Команда разработки" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildRecognitionSlideHtml(options: PdfExportOptions): string {
  const assets = resolveSlideAssetsForPdf(options);
  const kioskSrc = resolveAbsoluteUrl(assets.recognitionImageSrc);
  const qrUrl = resolveAbsoluteUrl(assets.qrImageSrc);
  const photoClass = assets.recognitionIsCustom
    ? 'slide-img-photo'
    : 'slide-img-photo slide-img-photo--kiosk-default';

  return `
    <div class="pdf-page pdf-page-slide" id="pdf-slide-recognition-view" data-slide="recognition">
      <div class="slide-decor-top-left"></div>
      <div class="slide-decor-bottom-right"></div>

      <div class="slide-badge-ai">Основано на компьютерном зрении и алгоритмах искусственного интеллекта (AI)</div>
      <h2 class="slide-title">Система распознавания еды</h2>
      <div class="slide-divider"></div>
      <p class="slide-disclaimer">*Обратите внимание: внешний вид интерфейса и конкретные модели оборудования могут отличаться от представленных в КП.</p>

      <div class="slide-content-grid">
        <div class="slide-text-col">
          <h3 class="slide-product-name">Умная касса</h3>
          <ul class="slide-list-items">
            <li>Сокращает расходы на содержание кассовых точек</li>
            <li>Исключает мошенничество и человеческий фактор при расчётах</li>
            <li>Работает 24/7 без перерывов и больничных</li>
            <li>Скорость распознавания блюд на подносе — менее 1 сек.</li>
            <li>Точность распознавания нейросетью — 99.9%</li>
          </ul>

          <div class="qr-code-block">
            <div class="qr-placeholder">
              <img src="${qrUrl}" alt="QR-код" />
            </div>
            <p>Отсканируйте QR-код, чтобы посмотреть видео работы умной кассы вживую</p>
          </div>
        </div>

        <div class="slide-image-col">
          <div class="slide-image-frame">
            <div class="slide-image-frame__corner slide-image-frame__corner--tl"></div>
            <div class="slide-image-frame__bracket slide-image-frame__bracket--tr"></div>
            <div class="slide-image-frame__bracket slide-image-frame__bracket--bl"></div>
            <div class="slide-image-frame__corner slide-image-frame__corner--br"></div>
            <div class="slide-img-placeholder">
              <img class="${photoClass}" src="${kioskSrc}" alt="Умная касса" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/** Selected marketing slides rendered as separate landscape pages before the estimate table. */
export function buildPresentationSlidesHtml(
  estimate: Estimate,
  options: PdfExportOptions = {}
): string {
  const selected = estimate.presentationSlides;
  if (!selected) return '';

  const parts: string[] = [];
  if (selected.about) parts.push(buildAboutSlideHtml(options));
  if (selected.recognition) parts.push(buildRecognitionSlideHtml(options));
  return parts.join('');
}

export function buildPdfHtml(estimate: Estimate, options: PdfExportOptions = {}): string {
  const totals = calculateEstimateTotals(estimate);
  const slidesHtml = buildPresentationSlidesHtml(estimate, options);
  const documentHtml = buildDocumentPage(estimate, totals, options);
  return `${slidesHtml}${documentHtml}`;
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
  const hasSlides =
    estimate.presentationSlides?.about === true ||
    estimate.presentationSlides?.recognition === true;

  const slideAssets = options.slideAssets ?? (await ensurePresentationSlideAssets());
  const resolvedOptions: PdfExportOptions = { ...options, slideAssets };

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = hasSlides ? '1123px' : '794px';
  container.style.background = '#fff';

  const styleEl = document.createElement('style');
  styleEl.textContent = pdfStyles();
  container.appendChild(styleEl);
  container.insertAdjacentHTML('beforeend', buildPdfHtml(estimate, resolvedOptions));
  wirePdfImageFallbacks(container);

  document.body.appendChild(container);

  try {
    await waitForImages(container);

    const slidePages = Array.from(
      container.querySelectorAll<HTMLElement>('.pdf-page-slide')
    );
    const documentPage = container.querySelector<HTMLElement>('.pdf-page--document');
    if (!documentPage && slidePages.length === 0) return;

    const startLandscape = slidePages.length > 0;
    const pdf = new jsPDF({
      orientation: startLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: 'a4',
    });

    let isFirst = true;

    for (const slideEl of slidePages) {
      await renderPageToPdf(pdf, slideEl, {
        isFirstPage: isFirst,
        landscape: true,
        captureWidth: 1123,
      });
      isFirst = false;
    }

    if (documentPage) {
      // Ensure document page is measured at portrait width.
      container.style.width = '794px';
      await renderPageToPdf(pdf, documentPage, {
        isFirstPage: isFirst,
        landscape: false,
        captureWidth: 794,
      });
    }

    const safeName = estimate.projectName.replace(/[^\wа-яА-ЯёЁ\s-]/gi, '').trim() || 'kp';
    pdf.save(`КП_${safeName}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
