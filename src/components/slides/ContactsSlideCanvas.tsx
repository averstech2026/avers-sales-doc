import {
  formatContactsSiteLabel,
  phoneToTelHref,
  resolveContactsMapSrc,
  type ContactsSlideContent,
} from '../../utils/presentationSlides';

export interface UnifiedFooterPreviewSignatures {
  clientName?: string;
  signerName?: string;
  signerPosition?: string;
}

interface ContactsSlideCanvasProps {
  content: ContactsSlideContent;
  className?: string;
  previewSignatures?: UnifiedFooterPreviewSignatures;
}

export function ContactsSlideCanvas({
  content,
  className = '',
  previewSignatures,
}: ContactsSlideCanvasProps) {
  const mapSrc = resolveContactsMapSrc(content);
  const siteHref = content.site.trim() || 'https://www.averstech.ru';
  const siteLabel = formatContactsSiteLabel(content.site);
  const telHref = phoneToTelHref(content.phone);
  const sectionTitle = content.title.trim() || 'Контакты';
  const clientName = previewSignatures?.clientName?.trim() || 'ООО «Заказчик»';
  const signerName = previewSignatures?.signerName?.trim() ?? '';
  const signerPosition = previewSignatures?.signerPosition?.trim() || 'Директор';

  return (
    <div className={`contacts-preview-doc ${className}`.trim()}>
      <div className="kp-unified-footer-section" data-slide="contacts">
        <div className="footer-integration-grid">
          <div className="footer-integration-signatures">
            <h4 className="integrated-section-title">Согласование сторон</h4>
            <div className="signatures-double-column">
              <div className="signature-column-block">
                <div className="sig-role-label">Исполнитель</div>
                <div className="sig-company-name">ООО «Аверс Технолоджи»</div>
                <div className="sig-draw-line" />
                <div className="sig-author-name">{signerName || '\u00a0'}</div>
                <div className="sig-author-title">{signerPosition}</div>
              </div>
              <div className="signature-column-block">
                <div className="sig-role-label">Заказчик</div>
                <div className="sig-company-name">{clientName}</div>
                <div className="sig-draw-line" />
                <div className="sig-author-name">{'\u00a0'}</div>
                <div className="sig-author-title">Уполномоченное лицо</div>
              </div>
            </div>
          </div>

          <div className="footer-integration-contacts">
            <h4 className="integrated-section-title">{sectionTitle}</h4>
            <div className="integrated-contacts-list">
              <div className="int-contact-row">
                <span className="int-contact-label">Адрес:</span>
                <span className="int-contact-value">{content.address}</span>
              </div>
              <div className="int-contact-row">
                <span className="int-contact-label">Сайт:</span>
                <span className="int-contact-value">
                  <a href={siteHref} target="_blank" rel="noreferrer" className="int-contact-link">
                    {siteLabel}
                  </a>
                </span>
              </div>
              <div className="int-contact-row">
                <span className="int-contact-label">Телефон:</span>
                <span className="int-contact-value">
                  <a href={telHref} className="int-contact-phone">
                    {content.phone}
                  </a>
                </span>
              </div>
              <div className="int-contact-row">
                <span className="int-contact-label">Email:</span>
                <span className="int-contact-value">
                  <a href={`mailto:${content.email}`} className="int-contact-link">
                    {content.email}
                  </a>
                </span>
              </div>
            </div>
            <div className="integrated-map-frame">
              <img src={mapSrc} alt="Схема проезда" className="integrated-map-img" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
