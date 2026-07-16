import { useLayoutEffect, useRef } from 'react';
import {
  isContactsContent,
  isContactsSlideId,
  parseBulletLines,
  resolveSlideImageSrc,
  resolveSlideQrSrc,
  type AnySlideContent,
  type ContactsSlideContent,
  type PresentationSlideContent,
  type PresentationSlideId,
} from '../../utils/presentationSlides';
import { ContactsSlideCanvas } from './ContactsSlideCanvas';

interface SlideCanvasProps {
  id: PresentationSlideId;
  content: AnySlideContent;
  className?: string;
}

export function SlideCanvas({ id, content, className = '' }: SlideCanvasProps) {
  if (isContactsSlideId(id) || isContactsContent(content)) {
    return (
      <ContactsSlideCanvas
        content={content as ContactsSlideContent}
        className={className}
      />
    );
  }

  return (
    <StandardSlideCanvas
      id={id}
      content={content as PresentationSlideContent}
      className={className}
    />
  );
}

function StandardSlideCanvas({
  id,
  content,
  className = '',
}: {
  id: Exclude<PresentationSlideId, 'contacts'>;
  content: PresentationSlideContent;
  className?: string;
}) {
  const bullets = parseBulletLines(content.bulletsText);
  const imageSrc = resolveSlideImageSrc(content, id);
  const qrSrc = resolveSlideQrSrc(content, id);
  const showBadge = Boolean(content.badge.trim());
  const showLead = Boolean(content.disclaimer.trim());
  const showSubtitle = Boolean(content.subtitle.trim());
  const showQr = Boolean(content.qrCaption.trim() && qrSrc);

  const textRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const textEl = textRef.current;
    const imageEl = imageRef.current;
    if (!textEl || !imageEl) return;

    const syncHeight = () => {
      // Высота только по блоку «НАШИ РЕШЕНИЯ» (+ QR), без лида сверху
      imageEl.style.height = `${Math.max(textEl.offsetHeight, 0)}px`;
    };

    syncHeight();

    const ro = new ResizeObserver(syncHeight);
    ro.observe(textEl);
    const probe = new Image();
    probe.onload = syncHeight;
    probe.src = imageSrc;

    return () => {
      ro.disconnect();
      probe.onload = null;
      imageEl.style.height = '';
    };
  }, [id, content, bullets.length, showBadge, showLead, showSubtitle, showQr, imageSrc]);

  return (
    <div className={`kp-slide presentation-slide ${className}`.trim()} data-slide={id}>
      <div className="slide-header">
        <h1 className="slide-title">{content.title || 'Заголовок слайда'}</h1>
        {showBadge && (
          <div className="kp-slide__badge">
            <span className="kp-slide__badge-icon">AI</span>
            <span>{content.badge}</span>
          </div>
        )}
        <div className="slide-header-line" />
      </div>

      <div
        className={`slide-content-grid${showLead ? ' slide-content-grid--with-lead' : ''}`.trim()}
      >
        {showLead && <p className="slide-description slide-lead">{content.disclaimer}</p>}

        <div className="slide-text-column" ref={textRef}>
          {(showSubtitle || bullets.length > 0 || content.body.trim()) && (
            <div className="solutions-block">
              {showSubtitle && <h3 className="solutions-title">{content.subtitle}</h3>}
              {bullets.length > 0 ? (
                <ul className="solutions-list">
                  {bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : content.body.trim() ? (
                <p className="slide-description slide-description--body">{content.body}</p>
              ) : null}
            </div>
          )}

          {showQr && (
            <div className="kp-slide__qr">
              <p className="kp-slide__qr-caption">{content.qrCaption}</p>
              <div className="kp-slide__qr-code">
                <img src={qrSrc!} alt="QR-код" />
              </div>
            </div>
          )}
        </div>

        <div className="slide-image-column" ref={imageRef}>
          <div className="slide-image-frame">
            <span className="slide-corner slide-corner--tl" aria-hidden />
            <span className="slide-corner slide-corner--tr" aria-hidden />
            <span className="slide-corner slide-corner--bl" aria-hidden />
            <span className="slide-corner slide-corner--br" aria-hidden />
            <div
              className="slide-image-wrapper"
              style={{ backgroundImage: `url(${JSON.stringify(imageSrc)})` }}
              role="img"
              aria-label=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}
