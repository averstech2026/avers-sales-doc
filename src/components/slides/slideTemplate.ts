import { AVERS_LOGO } from '../../utils/clientLogo';
import {
  formatContactsSiteLabel,
  getSlideBadgeIconMeta,
  parseBulletLines,
  phoneToTelHref,
  resolveContactsMapSrc,
  resolveSlideImageSrc,
  resolveSlideQrSrc,
  slideChipColorVars,
  type ContactsSlideContent,
  type PresentationSlideContent,
  type PresentationSlideId,
  type SlideBadgeIconId,
} from '../../utils/presentationSlides';
import { loadThemeColors } from '../../utils/personalization';
import {
  resolveLegalRequisites,
  type LegalRequisites,
} from '../../utils/legalRequisites';
import { buildSlideBadgeIconSvgHtml } from './SlideBadgeIcon';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chipColorStyleAttr(content: PresentationSlideContent): string {
  const vars = slideChipColorVars(content.badgeColor, content.qrBadgeColor);
  return Object.entries(vars)
    .map(([key, value]) => `${key}:${value}`)
    .join(';');
}

function buildBadgeIconHtml(badgeIcon: SlideBadgeIconId | string | undefined): string {
  const meta = getSlideBadgeIconMeta(badgeIcon);
  if (meta.id === 'none') return '';
  return `<span class="slide-badge-icon-container ${meta.containerClass}" data-badge-type="${meta.id}">${buildSlideBadgeIconSvgHtml(meta.id)}</span>`;
}

/** Shared CSS for standard KP slide layout (editor preview + PDF). */
export function standardSlideCss(): string {
  const accent = loadThemeColors().button || '#ef4444';

  return `
    .kp-slide, .kp-slide *, .presentation-slide, .presentation-slide * { box-sizing: border-box; }

    .presentation-slide,
    .kp-slide.presentation-slide {
      position: relative;
      width: 1123px;
      height: 794px;
      box-sizing: border-box;
      padding: 60px 80px;
      background-color: #ffffff;
      font-family: system-ui, -apple-system, 'Segoe UI', Inter, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: hidden;
      color: #0f172a;
      --slide-chip-row-width: 412px;
    }

    .slide-header {
      margin-bottom: 24px;
      flex-shrink: 0;
      text-align: left;
    }
    .slide-title-block {
      display: inline-block;
      max-width: 100%;
      margin-bottom: 12px;
      vertical-align: top;
    }
    .slide-title {
      font-size: 24px;
      font-weight: 800;
      color: #0c1c3f;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
      text-align: left;
      line-height: 1.2;
    }
    .slide-header-line {
      height: 1.5px;
      background-color: ${accent};
      width: 100%;
      border: none;
    }

    .kp-slide__badge {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      width: var(--slide-chip-row-width, 412px);
      max-width: 100%;
      margin: 0 0 14px;
      padding: 10px 16px 10px 12px;
      border-radius: 12px;
      background: var(--slide-badge-bg, #f0fdf4);
      border: none;
      color: var(--slide-badge-fg, #1e293b);
      box-sizing: border-box;
    }
    .kp-slide__badge-text {
      font-size: 11px;
      font-weight: 500;
      line-height: 1.4;
      color: inherit;
      text-align: left;
    }
    .slide-badge-icon-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      flex-shrink: 0;
      box-sizing: border-box;
    }
    .slide-badge-icon-container svg {
      display: block;
    }
    .badge-container-ai {
      background: linear-gradient(135deg, #f5f3ff 0%, #e0f2fe 100%);
      color: #7c3aed;
      border: 1px solid #ddd6fe;
    }
    .badge-container-ai svg {
      filter: drop-shadow(0 1px 2px rgba(124, 58, 237, 0.15));
    }
    .badge-container-star { background-color: #fffbeb; color: #d97706; }
    .badge-container-energy { background-color: #fff7ed; color: #ea580c; }
    .badge-container-system { background-color: #eff6ff; color: #2563eb; }
    .badge-container-success { background-color: #f0fdf4; color: #16a34a; }
    .badge-container-iot { background-color: #f0fdfa; color: #0d9488; }
    .badge-container-info {
      background-color: #f8fafc;
      color: #475569;
      border: 1px solid #e2e8f0;
    }

    .slide-content-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      column-gap: 40px;
      row-gap: 24px;
      flex: 0 0 auto;
      align-self: flex-start;
      width: 100%;
      min-height: 0;
      align-items: stretch;
    }

    .slide-content-grid > .slide-text-column {
      grid-column: 1;
      grid-row: 1;
      min-width: 0;
      text-align: left;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }

    .slide-content-grid > .slide-image-column {
      grid-column: 2;
      grid-row: 1;
    }

    .slide-content-grid--with-lead > .slide-lead {
      grid-column: 1;
      grid-row: 1;
      margin-bottom: 0;
    }

    .slide-content-grid--with-lead > .slide-text-column {
      grid-row: 2;
    }

    .slide-content-grid--with-lead > .slide-image-column {
      grid-row: 2;
    }

    .slide-text-column {
      min-width: 0;
      text-align: left;
    }
    .slide-description {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 24px 0;
      text-align: left;
    }
    .slide-description--body {
      margin-bottom: 0;
    }
    .solutions-block {
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .solutions-title {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 16px 0;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: left;
    }
    .solutions-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .solutions-list li {
      position: relative;
      font-size: 13px;
      line-height: 1.5;
      color: #334155;
      padding-left: 18px;
      margin-bottom: 10px;
      font-weight: 500;
      text-align: left;
    }
    .solutions-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${accent};
      font-size: 18px;
      line-height: 1;
      top: -1px;
    }

    .kp-slide__qr {
      margin-top: auto;
      padding-top: 24px;
      display: flex;
      align-items: flex-end;
      gap: 16px;
      width: var(--slide-chip-row-width, 412px);
      max-width: 100%;
      box-sizing: border-box;
    }
    .kp-slide__qr-caption {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      padding: 14px 20px;
      border-radius: 12px;
      background: var(--slide-qr-badge-bg, #e6f7f0);
      border: none;
      font-size: 12px;
      line-height: 1.4;
      color: var(--slide-qr-badge-fg, #0f172a);
      box-sizing: border-box;
    }
    .kp-slide__qr-code {
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      height: auto;
      flex-shrink: 0;
      border: 1.5px solid var(--slide-qr-badge-accent, #00a86b);
      border-radius: 8px;
      background: #fff;
      padding: 6px;
    }
    .kp-slide__qr-code img {
      width: 64px;
      height: 64px;
      object-fit: contain;
      display: block;
    }

    /* Высота фото = высота блока решений (stretch в том же ряду сетки) */
    .slide-image-column {
      position: relative;
      min-width: 0;
      min-height: 0;
      width: 100%;
      overflow: hidden;
      align-self: stretch;
    }
    .slide-image-frame {
      position: absolute;
      inset: 0;
    }
    .slide-corner {
      position: absolute;
      width: 32px;
      height: 32px;
      pointer-events: none;
      z-index: 1;
      box-sizing: border-box;
    }
    .slide-corner--tl {
      top: 0;
      left: 0;
      border-top: 4px solid ${accent};
      border-left: 4px solid ${accent};
    }
    .slide-corner--tr {
      top: 0;
      right: 0;
      border-top: 4px solid #0f172a;
      border-right: 4px solid #0f172a;
    }
    .slide-corner--bl {
      bottom: 0;
      left: 0;
      border-bottom: 4px solid #0f172a;
      border-left: 4px solid #0f172a;
    }
    .slide-corner--br {
      bottom: 0;
      right: 0;
      border-bottom: 4px solid ${accent};
      border-right: 4px solid ${accent};
    }
    .slide-image-wrapper {
      position: absolute;
      inset: 24px;
      overflow: hidden;
      border-radius: 2px;
      background-color: #e2e8f0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .slide-main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }

    /* --- Contacts slide --- */
    .contacts-slide {
      justify-content: space-between;
      padding: 60px 80px;
    }

    .contact-corner-decor {
      position: absolute;
      width: 50px;
      height: 50px;
      z-index: 10;
      pointer-events: none;
    }
    .contact-corner-decor--top-left {
      top: 40px;
      left: 40px;
    }
    .contact-corner-decor--bottom-right {
      bottom: 28px;
      right: 28px;
    }
    .contact-corner-decor .decor-square {
      position: absolute;
      width: 30px;
      height: 30px;
    }
    .contact-corner-decor--top-left .decor-square--red {
      background-color: ${accent};
      top: 0;
      left: 0;
    }
    .contact-corner-decor--top-left .decor-square--black {
      background-color: #0f172a;
      top: 15px;
      left: 15px;
    }
    .contact-corner-decor--bottom-right .decor-square--black {
      background-color: #0f172a;
      top: 0;
      left: 0;
    }
    .contact-corner-decor--bottom-right .decor-square--red {
      background-color: ${accent};
      top: 15px;
      left: 15px;
    }

    .contact-header-center {
      margin-top: 10px;
      margin-bottom: 40px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      flex-shrink: 0;
    }
    .contact-slide-title,
    .contact-header-center .slide-title {
      font-size: 26px !important;
      font-weight: 800 !important;
      color: #000000 !important;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 0 0 4px 0 !important;
      text-align: center !important;
    }
    .contact-header-center .slide-title-block {
      margin-left: auto;
      margin-right: auto;
      margin-bottom: 0;
    }
    .slide-header-line-red {
      height: 1.5px;
      background-color: ${accent};
      width: 100%;
      border: none;
    }

    .contacts-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 50px;
      align-items: center;
      flex-grow: 1;
      margin-bottom: 30px;
      min-height: 0;
    }
    .contacts-info-column {
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .contacts-details-list {
      list-style: none !important;
      padding: 0 !important;
      margin: 0 !important;
    }
    .contacts-details-list li {
      font-size: 15px !important;
      line-height: 1.6 !important;
      color: #0f172a !important;
      margin-bottom: 14px !important;
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    .detail-label {
      font-weight: 700 !important;
      color: #000000 !important;
      min-width: 65px;
      flex-shrink: 0;
      text-align: right;
    }
    .detail-value {
      color: #334155 !important;
    }
    .detail-link {
      color: #0284c7 !important;
      text-decoration: underline !important;
    }
    .detail-link-bold {
      color: #0f172a !important;
      font-weight: 700 !important;
      text-decoration: underline !important;
    }

    .contacts-map-column {
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .map-wrapper-pdf {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      width: 100%;
      max-width: 380px;
    }
    .contacts-map-image {
      width: 100% !important;
      height: auto !important;
      display: block;
      object-fit: cover;
    }

    .contacts-footer {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      padding-left: 8px;
      margin-bottom: 8px;
      flex-shrink: 0;
    }
    .footer-logo-wrapper {
      height: 36px;
    }
    .footer-brand-logo {
      height: 100%;
      width: auto;
      display: block;
      object-fit: contain;
    }
  `;
}

/** Compact CSS for slides embedded inside the vertical A4 KP document. */
export function embeddedSlideCss(): string {
  const accent = loadThemeColors().button || '#ef4444';

  return `
    .kp-embedded-slide-block {
      width: 100%;
      box-sizing: border-box;
      padding: 20px 0 22px;
      background-color: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .kp-embedded-slide-block + .kp-embedded-slide-block {
      border-top: none;
    }
    .embedded-slide-title-block {
      display: inline-block;
      max-width: 100%;
      margin-bottom: 12px;
      vertical-align: top;
    }
    /* Match .pdf-section-title */
    .embedded-slide-title {
      font-family: inherit;
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      margin: 0 0 4px 0;
      letter-spacing: 0;
      text-align: left;
      line-height: 1.2;
    }
    /* Match .pdf-section-accent */
    .embedded-slide-accent {
      width: 100%;
      height: 1.5px;
      background: ${accent};
    }
    .embedded-slide-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      width: 300px;
      max-width: 100%;
      margin: 0 0 10px;
      padding: 6px 12px 6px 8px;
      border-radius: 8px;
      background: var(--slide-badge-bg, #f0fdf4);
      border: none;
      color: var(--slide-badge-fg, #1e293b);
      font-size: 10px;
      font-weight: 500;
      line-height: 1.35;
      box-sizing: border-box;
    }
    .embedded-slide-badge .kp-slide__badge-text {
      font-size: 10px;
      line-height: 1.35;
      color: inherit;
      text-align: left;
    }
    .embedded-slide-badge .slide-badge-icon-container {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      flex-shrink: 0;
    }
    .embedded-slide-badge .slide-badge-icon-container svg {
      width: 14px;
      height: 14px;
    }
    /* Match .pdf-description */
    .embedded-slide-description {
      font-size: 11px;
      line-height: 1.5;
      color: #64748b;
      margin: 0 0 14px 0;
      text-align: left;
    }
    /* Title + lead full width; solutions + photo side by side */
    .embedded-slide-body-row {
      display: grid;
      grid-template-columns: 1.2fr 0.8fr;
      gap: 28px;
      align-items: start;
    }
    /* Match .pdf-description-title — no caps */
    .embedded-solutions-title {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
      letter-spacing: 0;
      text-transform: none;
    }
    .embedded-solutions-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
    }
    .embedded-solutions-list li {
      position: relative;
      font-size: 10.5px;
      line-height: 1.35;
      color: #334155;
      padding-left: 12px;
      font-weight: 500;
    }
    .embedded-solutions-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${accent};
      font-size: 12px;
      line-height: 1;
      top: 0;
    }
    .embedded-slide-body {
      font-size: 11px;
      line-height: 1.5;
      color: #64748b;
      margin: 0;
    }
    .embedded-slide-qr {
      margin-top: 12px;
      display: flex;
      align-items: flex-end;
      gap: 12px;
      width: 300px;
      max-width: 100%;
      box-sizing: border-box;
    }
    .embedded-slide-qr-caption {
      flex: 1 1 auto;
      min-width: 0;
      margin: 0;
      padding: 10px 14px;
      border-radius: 8px;
      background: var(--slide-qr-badge-bg, #e6f7f0);
      border: none;
      font-size: 10px;
      line-height: 1.35;
      color: var(--slide-qr-badge-fg, #0f172a);
      box-sizing: border-box;
    }
    .embedded-slide-qr-code {
      display: flex;
      align-items: center;
      justify-content: center;
      width: auto;
      height: auto;
      flex-shrink: 0;
      border: 1.5px solid var(--slide-qr-badge-accent, #00a86b);
      border-radius: 6px;
      background: #fff;
      padding: 4px;
    }
    .embedded-slide-qr-code img {
      width: 48px;
      height: 48px;
      object-fit: contain;
      display: block;
    }
    .embedded-slide-media {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
      min-height: 0;
    }
    .embedded-image-wrapper {
      position: relative;
      width: 100%;
      max-width: 280px;
      padding: 8px;
      box-sizing: border-box;
    }
    .embedded-image {
      width: 100%;
      height: auto;
      max-height: 200px;
      object-fit: contain;
      object-position: center top;
      border-radius: 2px;
      display: block;
      background: #ffffff;
    }
    .img-corner {
      position: absolute;
      width: 20px;
      height: 20px;
      border: 2.5px solid transparent;
      z-index: 5;
      box-sizing: border-box;
      pointer-events: none;
    }
    .img-corner.top-left-red {
      top: 0;
      left: 0;
      border-top-color: ${accent};
      border-left-color: ${accent};
    }
    .img-corner.top-right-dark {
      top: 0;
      right: 0;
      border-top-color: #0f172a;
      border-right-color: #0f172a;
    }
    .img-corner.bottom-left-dark {
      bottom: 0;
      left: 0;
      border-bottom-color: #0f172a;
      border-left-color: #0f172a;
    }
    .img-corner.bottom-right-dark {
      bottom: 0;
      right: 0;
      border-bottom-color: #0f172a;
      border-right-color: #0f172a;
    }

    /* Unified footer — signatures + contacts */
    ${unifiedFooterSectionCss()}
  `;
}

export interface UnifiedFooterSignatureParams {
  signerName: string;
  signerPosition: string;
  clientName: string;
}

/** Integrated KP footer: party signatures (left) + contacts & map (right). */
export function unifiedFooterSectionCss(): string {
  return `
    .kp-unified-footer-section {
      width: 100%;
      box-sizing: border-box;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 1.5px solid #ef4444;
      page-break-inside: avoid;
    }
    .footer-integration-grid {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 40px;
    }
    .footer-integration-grid--signatures-only {
      grid-template-columns: 1fr;
    }
    .integrated-section-title {
      font-family: inherit;
      font-size: 11px !important;
      font-weight: 800 !important;
      text-transform: uppercase;
      color: #0f172a !important;
      letter-spacing: 0.8px;
      margin: 0 0 24px 0 !important;
      text-align: left !important;
    }
    .signatures-double-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }
    .signature-column-block {
      display: flex;
      flex-direction: column;
    }
    .sig-role-label {
      font-size: 9px !important;
      font-weight: 700 !important;
      color: #64748b !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .sig-company-name {
      font-size: 11px !important;
      font-weight: 600 !important;
      color: #0f172a !important;
      margin-bottom: 24px;
      height: 28px;
      display: flex;
      align-items: flex-start;
    }
    .sig-draw-line {
      border-bottom: 1px solid #cbd5e1;
      margin-bottom: 6px;
      width: 100%;
    }
    .sig-author-name {
      font-size: 11px !important;
      font-weight: 700 !important;
      color: #1e293b !important;
      min-height: 14px;
    }
    .sig-author-title {
      font-size: 10px !important;
      color: #64748b !important;
      margin-top: 2px;
    }
    .footer-integration-contacts {
      border-left: 1px solid #e2e8f0;
      padding-left: 40px;
    }
    .integrated-contacts-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .int-contact-row {
      display: flex;
      align-items: baseline;
      font-size: 11px !important;
    }
    .int-contact-label {
      font-weight: 700 !important;
      color: #64748b !important;
      width: 65px;
      display: inline-block;
    }
    .int-contact-value {
      color: #0f172a !important;
    }
    .int-contact-link {
      color: #ef4444 !important;
      text-decoration: none !important;
      font-weight: 600;
    }
    .int-contact-phone {
      color: #0f172a !important;
      font-weight: 800 !important;
      text-decoration: none !important;
    }
    .integrated-map-frame {
      width: 100%;
      height: 110px;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .integrated-map-img {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover !important;
      display: block;
    }

    /* Legal requisites block under signatures / contacts */
    .requisites-divider-line {
      height: 1px;
      background-color: #e2e8f0;
      margin: 20px 0 15px 0;
      width: 100%;
    }
    .printable-requisites-block {
      margin-bottom: 8px;
      font-family: inherit;
    }
    .printable-requisites-block.hide-requisites {
      display: none !important;
    }
    .requisites-grid {
      display: flex;
      justify-content: space-between;
      gap: 20px;
    }
    .req-column {
      flex: 1;
      font-size: 11px !important;
      line-height: 1.5;
      color: #64748b !important;
    }
    .req-label {
      font-size: 10px !important;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 700 !important;
      color: #475569 !important;
      margin-bottom: 6px;
    }
    .req-value {
      font-size: 11px !important;
      color: #64748b !important;
      margin-bottom: 2px;
    }
    .req-value strong {
      color: #1f2937 !important;
      font-weight: 700;
    }
    .req-value span {
      font-weight: 600;
      color: #475569 !important;
    }
  `;
}

function buildIntegratedContactsColumnHtml(content: ContactsSlideContent): string {
  const mapSrc = resolveContactsMapSrc(content);
  const siteHref = escapeHtml(content.site.trim() || 'https://www.averstech.ru');
  const siteLabel = escapeHtml(formatContactsSiteLabel(content.site));
  const telHref = escapeHtml(phoneToTelHref(content.phone));
  const emailHref = escapeHtml(`mailto:${content.email.trim()}`);
  const sectionTitle = escapeHtml(content.title.trim() || 'Контакты');

  return `
    <div class="footer-integration-contacts">
      <h4 class="integrated-section-title">${sectionTitle}</h4>
      <div class="integrated-contacts-list">
        <div class="int-contact-row">
          <span class="int-contact-label">Адрес:</span>
          <span class="int-contact-value">${escapeHtml(content.address)}</span>
        </div>
        <div class="int-contact-row">
          <span class="int-contact-label">Сайт:</span>
          <span class="int-contact-value">
            <a href="${siteHref}" target="_blank" class="int-contact-link">${siteLabel}</a>
          </span>
        </div>
        <div class="int-contact-row">
          <span class="int-contact-label">Телефон:</span>
          <span class="int-contact-value">
            <a href="${telHref}" class="int-contact-phone">${escapeHtml(content.phone)}</a>
          </span>
        </div>
        <div class="int-contact-row">
          <span class="int-contact-label">Email:</span>
          <span class="int-contact-value">
            <a href="${emailHref}" class="int-contact-link">${escapeHtml(content.email)}</a>
          </span>
        </div>
      </div>
      <div class="integrated-map-frame">
        <img src="${mapSrc}" alt="Схема проезда" class="integrated-map-img" />
      </div>
    </div>
  `;
}

export function buildLegalRequisitesBlockHtml(
  include: boolean,
  requisites?: LegalRequisites | null
): string {
  const r = requisites ?? resolveLegalRequisites();
  const hideClass = include ? '' : ' hide-requisites';

  return `
    <div class="printable-requisites-block${hideClass}" id="pdf-requisites-section">
      <div class="requisites-divider-line"></div>
      <div class="requisites-grid">
        <div class="req-column">
          <div class="req-label">Организация</div>
          <div class="req-value"><strong>${escapeHtml(r.fullName)}</strong></div>
          <div class="req-value">Юр. адрес: ${escapeHtml(r.legalAddress)}</div>
        </div>
        <div class="req-column">
          <div class="req-label">Регистрационные данные</div>
          <div class="req-value"><span>ИНН:</span> ${escapeHtml(r.inn)}</div>
          <div class="req-value"><span>КПП:</span> ${escapeHtml(r.kpp)}</div>
          <div class="req-value"><span>ОГРН:</span> ${escapeHtml(r.ogrn)}</div>
        </div>
        <div class="req-column">
          <div class="req-label">Банковские реквизиты</div>
          <div class="req-value"><span>Р/с:</span> ${escapeHtml(r.bankAccount)}</div>
          <div class="req-value"><span>Банк:</span> ${escapeHtml(r.bankName)}</div>
          <div class="req-value"><span>БИК:</span> ${escapeHtml(r.bik)} &nbsp;&nbsp; <span>К/с:</span> ${escapeHtml(r.corrAccount)}</div>
        </div>
      </div>
    </div>
  `;
}

export function buildUnifiedFooterSectionHtml(
  signatures: UnifiedFooterSignatureParams,
  contacts: ContactsSlideContent | null,
  options: { includeLegalRequisites?: boolean; legalRequisites?: LegalRequisites | null } = {}
): string {
  const signerName = signatures.signerName.trim();
  const signerPosition = signatures.signerPosition.trim();
  const clientName = signatures.clientName.trim() || '—';
  const contactsColumn = contacts ? buildIntegratedContactsColumnHtml(contacts) : '';
  const gridClass = contacts
    ? 'footer-integration-grid'
    : 'footer-integration-grid footer-integration-grid--signatures-only';
  const includeRequisites = options.includeLegalRequisites !== false;
  const requisitesBlock = buildLegalRequisitesBlockHtml(
    includeRequisites,
    options.legalRequisites
  );

  return `
    <div class="kp-unified-footer-section" data-slide="contacts">
      <div class="${gridClass}">
        <div class="footer-integration-signatures">
          <h4 class="integrated-section-title">Согласование сторон</h4>
          <div class="signatures-double-column">
            <div class="signature-column-block">
              <div class="sig-role-label">Исполнитель</div>
              <div class="sig-company-name">ООО «Аверс Технолоджи»</div>
              <div class="sig-draw-line"></div>
              <div class="sig-author-name">${signerName ? escapeHtml(signerName) : '&nbsp;'}</div>
              <div class="sig-author-title">${signerPosition ? escapeHtml(signerPosition) : 'Директор'}</div>
            </div>
            <div class="signature-column-block">
              <div class="sig-role-label">Заказчик</div>
              <div class="sig-company-name">${escapeHtml(clientName)}</div>
              <div class="sig-draw-line"></div>
              <div class="sig-author-name">&nbsp;</div>
              <div class="sig-author-title">Уполномоченное лицо</div>
            </div>
          </div>
        </div>
        ${contactsColumn}
      </div>
      ${requisitesBlock}
    </div>
  `;
}

export function buildEmbeddedStandardSlideHtml(
  id: Exclude<PresentationSlideId, 'contacts'> | string,
  content: PresentationSlideContent,
  defaultImageFile?: string
): string {
  const bullets = parseBulletLines(content.bulletsText);
  const imageSrc = resolveSlideImageSrc(content, id, defaultImageFile);
  const qrSrc = resolveSlideQrSrc(content, id);
  const showBadge = Boolean(content.badge.trim());
  const showLead = Boolean(content.disclaimer.trim());
  const showSubtitle = Boolean(content.subtitle.trim());
  const showQr = Boolean(content.qrCaption.trim() && qrSrc);

  const badgeHtml = showBadge
    ? `<div class="embedded-slide-badge">${buildBadgeIconHtml(content.badgeIcon)}<span class="kp-slide__badge-text">${escapeHtml(content.badge)}</span></div>`
    : '';

  const leadHtml = showLead
    ? `<p class="embedded-slide-description">${escapeHtml(content.disclaimer)}</p>`
    : '';

  const subtitleHtml = showSubtitle
    ? `<h3 class="embedded-solutions-title">${escapeHtml(formatEmbeddedSubtitle(content.subtitle))}</h3>`
    : '';

  const listHtml =
    bullets.length > 0
      ? `<ul class="embedded-solutions-list">${bullets
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      : '';
  const bodyHtml = content.body.trim()
    ? `<p class="embedded-slide-body">${escapeHtml(content.body)}</p>`
    : '';

  const solutionsHtml =
    showSubtitle || bodyHtml
      ? `<div class="embedded-solutions">${subtitleHtml}${bodyHtml}${listHtml}</div>`
      : '';

  const qrHtml = showQr
    ? `<div class="embedded-slide-qr">
        <p class="embedded-slide-qr-caption">${escapeHtml(content.qrCaption)}</p>
        <div class="embedded-slide-qr-code"><img src="${qrSrc}" alt="QR-код" /></div>
      </div>`
    : '';

  const mediaHtml = `
    <div class="embedded-slide-media">
      <div class="embedded-image-wrapper">
        <span class="img-corner top-left-red" aria-hidden="true"></span>
        <span class="img-corner bottom-right-dark" aria-hidden="true"></span>
        <img src="${imageSrc}" alt="" class="embedded-image" />
      </div>
    </div>`;

  const hasBodyRow = Boolean(solutionsHtml || qrHtml);

  return `
    <div class="kp-embedded-slide-block" data-slide="${id}" style="${escapeHtml(chipColorStyleAttr(content))}">
      <div class="embedded-slide-title-block">
        <h2 class="embedded-slide-title">${escapeHtml(content.title || 'Заголовок')}</h2>
        <div class="embedded-slide-accent"></div>
      </div>
      ${badgeHtml}
      ${leadHtml}
      ${
        hasBodyRow
          ? `<div class="embedded-slide-body-row">
              <div class="embedded-slide-text">
                ${solutionsHtml}
                ${qrHtml}
              </div>
              ${mediaHtml}
            </div>`
          : mediaHtml
      }
    </div>
  `;
}

/** Sentence case for ALL-CAPS subtitles like «НАШИ РЕШЕНИЯ:» → «Наши решения:» */
function formatEmbeddedSubtitle(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const letters = trimmed.replace(/[^A-Za-zА-Яа-яЁё]/g, '');
  if (!letters || letters !== letters.toUpperCase()) return trimmed;
  const lower = trimmed.toLocaleLowerCase('ru-RU');
  return lower.charAt(0).toLocaleUpperCase('ru-RU') + lower.slice(1);
}

/** @deprecated Use buildUnifiedFooterSectionHtml — kept for call-site compatibility. */
export function buildEmbeddedContactsSlideHtml(
  content: ContactsSlideContent,
  signatures: UnifiedFooterSignatureParams = {
    signerName: '',
    signerPosition: '',
    clientName: '—',
  }
): string {
  return buildUnifiedFooterSectionHtml(signatures, content);
}

export function buildStandardSlideHtml(
  id: Exclude<PresentationSlideId, 'contacts'>,
  content: PresentationSlideContent
): string {
  const bullets = parseBulletLines(content.bulletsText);
  const imageSrc = resolveSlideImageSrc(content, id);
  const qrSrc = resolveSlideQrSrc(content, id);
  const showBadge = Boolean(content.badge.trim());
  const showLead = Boolean(content.disclaimer.trim());
  const showSubtitle = Boolean(content.subtitle.trim());
  const showQr = Boolean(content.qrCaption.trim() && qrSrc);

  const badgeHtml = showBadge
    ? `<div class="kp-slide__badge">${buildBadgeIconHtml(content.badgeIcon)}<span class="kp-slide__badge-text">${escapeHtml(content.badge)}</span></div>`
    : '';

  const leadHtml = showLead
    ? `<p class="slide-description slide-lead">${escapeHtml(content.disclaimer)}</p>`
    : '';

  const subtitleHtml = showSubtitle
    ? `<h3 class="solutions-title">${escapeHtml(content.subtitle)}</h3>`
    : '';

  const listHtml =
    bullets.length > 0
      ? `<ul class="solutions-list">${bullets
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      : '';
  const bodyHtml = content.body.trim()
    ? `<p class="slide-description slide-description--body">${escapeHtml(content.body)}</p>`
    : '';

  const solutionsHtml =
    showSubtitle || bodyHtml
      ? `<div class="solutions-block">${subtitleHtml}${bodyHtml}${listHtml}</div>`
      : '';

  const qrHtml = showQr
    ? `<div class="kp-slide__qr">
        <p class="kp-slide__qr-caption">${escapeHtml(content.qrCaption)}</p>
        <div class="kp-slide__qr-code"><img src="${qrSrc}" alt="QR-код" /></div>
      </div>`
    : '';

  return `
    <div class="pdf-page pdf-page-slide kp-slide presentation-slide" data-slide="${id}" style="${escapeHtml(chipColorStyleAttr(content))}">
      <div class="slide-header">
        <div class="slide-title-block">
          <h1 class="slide-title">${escapeHtml(content.title)}</h1>
          <div class="slide-header-line"></div>
        </div>
        ${badgeHtml}
      </div>

      <div class="slide-content-grid${showLead ? ' slide-content-grid--with-lead' : ''}">
        ${leadHtml}
        <div class="slide-text-column">
          ${solutionsHtml}
          ${qrHtml}
        </div>
        <div class="slide-image-column">
          <div class="slide-image-frame">
            <span class="slide-corner slide-corner--tl" aria-hidden="true"></span>
            <span class="slide-corner slide-corner--tr" aria-hidden="true"></span>
            <span class="slide-corner slide-corner--bl" aria-hidden="true"></span>
            <span class="slide-corner slide-corner--br" aria-hidden="true"></span>
            <div class="slide-image-wrapper" style="${escapeHtml(`background-image:url(${JSON.stringify(imageSrc)})`)}" role="img" aria-label=""></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function buildContactsSlideHtml(content: ContactsSlideContent): string {
  const mapSrc = resolveContactsMapSrc(content);
  const siteHref = escapeHtml(content.site.trim() || 'https://www.averstech.ru');
  const telHref = escapeHtml(phoneToTelHref(content.phone));
  const emailHref = escapeHtml(`mailto:${content.email.trim()}`);
  const logoSrc = AVERS_LOGO;

  return `
    <div class="pdf-page pdf-page-slide kp-slide presentation-slide contacts-slide" data-slide="contacts">
      <div class="contact-corner-decor contact-corner-decor--top-left" aria-hidden="true">
        <span class="decor-square decor-square--red"></span>
        <span class="decor-square decor-square--black"></span>
      </div>

      <div class="slide-header contact-header-center">
        <div class="slide-title-block">
          <h1 class="slide-title contact-slide-title">${escapeHtml(content.title || 'КОНТАКТЫ')}</h1>
          <div class="slide-header-line-red"></div>
        </div>
      </div>

      <div class="contacts-grid">
        <div class="contacts-info-column">
          <ul class="contacts-details-list">
            <li>
              <span class="detail-label">Адрес:</span>
              <span class="detail-value">${escapeHtml(content.address)}</span>
            </li>
            <li>
              <span class="detail-label">Сайт:</span>
              <a href="${siteHref}" target="_blank" class="detail-link">${escapeHtml(content.site)}</a>
            </li>
            <li>
              <span class="detail-label">Тел:</span>
              <a href="${telHref}" class="detail-link-bold">${escapeHtml(content.phone)}</a>
            </li>
            <li>
              <span class="detail-label">Мейл:</span>
              <a href="${emailHref}" class="detail-link">${escapeHtml(content.email)}</a>
            </li>
          </ul>
        </div>
        <div class="contacts-map-column">
          <div class="map-wrapper-pdf">
            <img src="${mapSrc}" alt="Карта проезда Аверс Технолоджи" class="contacts-map-image" />
          </div>
        </div>
      </div>

      <div class="contacts-footer">
        <div class="footer-logo-wrapper">
          <img src="${logoSrc}" alt="Avers Technology" class="footer-brand-logo" />
        </div>
      </div>

      <div class="contact-corner-decor contact-corner-decor--bottom-right" aria-hidden="true">
        <span class="decor-square decor-square--black"></span>
        <span class="decor-square decor-square--red"></span>
      </div>
    </div>
  `;
}
