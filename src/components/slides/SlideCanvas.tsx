import {
  parseBulletLines,
  resolveSlideImageSrc,
  resolveSlideQrSrc,
  type PresentationSlideContent,
  type PresentationSlideId,
} from '../../utils/presentationSlides';

interface SlideCanvasProps {
  id: PresentationSlideId;
  content: PresentationSlideContent;
  className?: string;
}

export function SlideCanvas({ id, content, className = '' }: SlideCanvasProps) {
  const bullets = parseBulletLines(content.bulletsText);
  const imageSrc = resolveSlideImageSrc(content, id);
  const qrSrc = resolveSlideQrSrc(content, id);
  const showBadge = Boolean(content.badge.trim());
  const showLead = Boolean(content.disclaimer.trim());
  const showSubtitle = Boolean(content.subtitle.trim());
  const showQr = Boolean(content.qrCaption.trim() && qrSrc);
  /** Product slides (badge/QR) use image corner brackets; about uses page corner decor. */
  const framed = showBadge || showQr;

  return (
    <div
      className={`kp-slide${framed ? ' kp-slide--framed' : ''} ${className}`.trim()}
      data-slide={id}
    >
      <div className="kp-slide__corner kp-slide__corner--tl" aria-hidden="true" />
      <div className="kp-slide__corner kp-slide__corner--br" aria-hidden="true" />

      <header className="kp-slide__header">
        <h2 className="kp-slide__title">{content.title || 'Заголовок слайда'}</h2>
        {showBadge && (
          <div className="kp-slide__badge">
            <span className="kp-slide__badge-icon">AI</span>
            <span>{content.badge}</span>
          </div>
        )}
        <div className="kp-slide__divider" />
      </header>

      {showLead && <p className="kp-slide__lead">{content.disclaimer}</p>}

      <div className="kp-slide__main">
        <div className="kp-slide__col">
          {showSubtitle && <h3 className="kp-slide__subtitle">{content.subtitle}</h3>}
          {bullets.length > 0 ? (
            <ul className="kp-slide__list">
              {bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : content.body.trim() ? (
            <p className="kp-slide__body">{content.body}</p>
          ) : null}
          {showQr && (
            <div className="kp-slide__qr">
              <p className="kp-slide__qr-caption">{content.qrCaption}</p>
              <div className="kp-slide__qr-code">
                <img src={qrSrc!} alt="QR-код" />
              </div>
            </div>
          )}
        </div>

        <div className="kp-slide__media">
          {framed && (
            <>
              <div className="kp-slide__frame-sq kp-slide__frame-sq--tl" />
              <div className="kp-slide__frame-br kp-slide__frame-br--tr" />
              <div className="kp-slide__frame-br kp-slide__frame-br--bl" />
              <div className="kp-slide__frame-sq kp-slide__frame-sq--br" />
            </>
          )}
          <div className="kp-slide__photo-wrap">
            <img className="kp-slide__photo" src={imageSrc} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}
