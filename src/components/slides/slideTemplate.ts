import {
  parseBulletLines,
  resolveSlideImageSrc,
  resolveSlideQrSrc,
  type PresentationSlideContent,
  type PresentationSlideId,
} from '../../utils/presentationSlides';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Shared CSS for standard KP slide layout (editor preview + PDF). */
export function standardSlideCss(): string {
  return `
    .kp-slide, .kp-slide * { box-sizing: border-box; }
    .kp-slide {
      width: 1123px;
      height: 794px;
      position: relative;
      background: #ffffff;
      padding: 52px 64px 48px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      font-family: system-ui, -apple-system, 'Segoe UI', Arial, sans-serif;
      color: #0f172a;
    }
    .kp-slide__corner {
      position: absolute;
      width: 28px;
      height: 28px;
      background: #0052cc;
      z-index: 3;
      pointer-events: none;
    }
    .kp-slide__corner--tl {
      top: 28px;
      left: 28px;
      box-shadow: 10px 10px 0 0 #0f172a;
    }
    .kp-slide__corner--br {
      bottom: 28px;
      right: 28px;
      box-shadow: -10px -10px 0 0 #0f172a;
    }
    .kp-slide__header {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex-shrink: 0;
      padding-right: 40px;
    }
    .kp-slide__title {
      margin: 0 0 12px;
      font-size: 26px;
      font-weight: 800;
      line-height: 1.15;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      color: #0f172a;
      max-width: 920px;
    }
    .kp-slide__badge {
      display: inline-flex;
      align-items: flex-start;
      gap: 10px;
      max-width: 720px;
      margin: 0 0 14px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #eef7f0;
      border: 1px solid #d8ebe0;
      color: #1f2937;
      font-size: 12px;
      font-weight: 500;
      line-height: 1.4;
    }
    .kp-slide__badge-icon {
      flex-shrink: 0;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      background: linear-gradient(145deg, #7c3aed, #4f46e5);
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .kp-slide__divider {
      height: 3px;
      width: 100%;
      max-width: 920px;
      background: #0052cc;
      margin: 0 0 14px;
    }
    .kp-slide__lead {
      margin: 0 0 22px;
      max-width: 78%;
      font-size: 14px;
      line-height: 1.55;
      color: #334155;
      flex-shrink: 0;
    }
    .kp-slide--framed .kp-slide__lead {
      font-size: 11px;
      font-style: italic;
      color: #64748b;
      max-width: 70%;
      margin-bottom: 18px;
    }
    .kp-slide__main {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 1.05fr 0.95fr;
      gap: 36px 40px;
      align-items: stretch;
    }
    .kp-slide__col {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }
    .kp-slide__subtitle {
      margin: 0 0 12px;
      font-size: 15px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #0f172a;
    }
    .kp-slide__list {
      margin: 0;
      padding-left: 18px;
      list-style: disc;
    }
    .kp-slide__list li {
      margin: 0 0 7px;
      font-size: 13px;
      line-height: 1.35;
      color: #1e293b;
    }
    .kp-slide__body {
      margin: 0;
      font-size: 14px;
      line-height: 1.55;
      color: #1e293b;
    }
    .kp-slide__qr {
      margin-top: auto;
      padding-top: 18px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .kp-slide__qr-caption {
      flex: 1;
      min-width: 0;
      margin: 0;
      padding: 12px 14px;
      border-radius: 10px;
      background: #eef7f0;
      border: 1px solid #d8ebe0;
      font-size: 12px;
      line-height: 1.4;
      color: #1f2937;
    }
    .kp-slide__qr-code {
      width: 78px;
      height: 78px;
      flex-shrink: 0;
      border: 2px solid #86efac;
      border-radius: 6px;
      background: #fff;
      padding: 4px;
    }
    .kp-slide__qr-code img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
    .kp-slide__media {
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 0;
      align-self: stretch;
      padding: 0;
    }
    .kp-slide--framed .kp-slide__media {
      padding: 16px;
    }
    .kp-slide__photo-wrap {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #e2e8f0;
    }
    .kp-slide__frame-sq {
      position: absolute;
      width: 16px;
      height: 16px;
      background: #0052cc;
      z-index: 2;
    }
    .kp-slide__frame-sq--tl { top: 0; left: 0; }
    .kp-slide__frame-sq--br { bottom: 0; right: 0; }
    .kp-slide__frame-br {
      position: absolute;
      width: 26px;
      height: 26px;
      z-index: 2;
    }
    .kp-slide__frame-br--tr {
      top: 2px;
      right: 2px;
      border-top: 3px solid #0f172a;
      border-right: 3px solid #0f172a;
    }
    .kp-slide__frame-br--bl {
      bottom: 2px;
      left: 2px;
      border-bottom: 3px solid #0f172a;
      border-left: 3px solid #0f172a;
    }
    .kp-slide__photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
  `;
}

export function buildStandardSlideHtml(
  id: PresentationSlideId,
  content: PresentationSlideContent
): string {
  const bullets = parseBulletLines(content.bulletsText);
  const imageSrc = resolveSlideImageSrc(content, id);
  const qrSrc = resolveSlideQrSrc(content, id);
  const showBadge = Boolean(content.badge.trim());
  const showLead = Boolean(content.disclaimer.trim());
  const showSubtitle = Boolean(content.subtitle.trim());
  const showQr = Boolean(content.qrCaption.trim() && qrSrc);
  const framed = showBadge || showQr;

  const badgeHtml = showBadge
    ? `<div class="kp-slide__badge"><span class="kp-slide__badge-icon">AI</span><span>${escapeHtml(content.badge)}</span></div>`
    : '';

  const leadHtml = showLead
    ? `<p class="kp-slide__lead">${escapeHtml(content.disclaimer)}</p>`
    : '';

  const subtitleHtml = showSubtitle
    ? `<h3 class="kp-slide__subtitle">${escapeHtml(content.subtitle)}</h3>`
    : '';

  const bodyHtml =
    bullets.length > 0
      ? `<ul class="kp-slide__list">${bullets
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('')}</ul>`
      : content.body.trim()
        ? `<p class="kp-slide__body">${escapeHtml(content.body)}</p>`
        : '';

  const qrHtml = showQr
    ? `<div class="kp-slide__qr">
        <p class="kp-slide__qr-caption">${escapeHtml(content.qrCaption)}</p>
        <div class="kp-slide__qr-code"><img src="${qrSrc}" alt="QR-код" /></div>
      </div>`
    : '';

  const framesHtml = framed
    ? `<div class="kp-slide__frame-sq kp-slide__frame-sq--tl"></div>
       <div class="kp-slide__frame-br kp-slide__frame-br--tr"></div>
       <div class="kp-slide__frame-br kp-slide__frame-br--bl"></div>
       <div class="kp-slide__frame-sq kp-slide__frame-sq--br"></div>`
    : '';

  return `
    <div class="pdf-page pdf-page-slide kp-slide${framed ? ' kp-slide--framed' : ''}" data-slide="${id}">
      <div class="kp-slide__corner kp-slide__corner--tl"></div>
      <div class="kp-slide__corner kp-slide__corner--br"></div>

      <header class="kp-slide__header">
        <h2 class="kp-slide__title">${escapeHtml(content.title)}</h2>
        ${badgeHtml}
        <div class="kp-slide__divider"></div>
      </header>

      ${leadHtml}

      <div class="kp-slide__main">
        <div class="kp-slide__col">
          ${subtitleHtml}
          ${bodyHtml}
          ${qrHtml}
        </div>
        <div class="kp-slide__media">
          ${framesHtml}
          <div class="kp-slide__photo-wrap">
            <img class="kp-slide__photo" src="${imageSrc}" alt="" />
          </div>
        </div>
      </div>
    </div>
  `;
}
