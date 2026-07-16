import {
  formatContactsSiteLabel,
  phoneToTelHref,
  resolveContactsMapSrc,
  type ContactsSlideContent,
} from '../../utils/presentationSlides';

interface ContactsSlideCanvasProps {
  content: ContactsSlideContent;
  className?: string;
}

export function ContactsSlideCanvas({ content, className = '' }: ContactsSlideCanvasProps) {
  const mapSrc = resolveContactsMapSrc(content);
  const siteHref = content.site.trim() || 'https://www.averstech.ru';
  const siteLabel = formatContactsSiteLabel(content.site);
  const telHref = phoneToTelHref(content.phone);
  const sectionTitle = content.title.trim() || 'Контакты компании';

  return (
    <div className={`contacts-preview-doc ${className}`.trim()}>
      <div className="kp-final-contacts-section" data-slide="contacts">
        <h3 className="contacts-section-title">{sectionTitle}</h3>
        <div className="contacts-clean-grid">
          <div className="contacts-clean-info">
            <div className="contact-item">
              <span className="contact-label">Адрес:</span>
              <span className="contact-value">{content.address}</span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Сайт:</span>
              <span className="contact-value">
                <a href={siteHref} target="_blank" rel="noreferrer" className="contact-link">
                  {siteLabel}
                </a>
              </span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Телефон:</span>
              <span className="contact-value">
                <a href={telHref} className="contact-phone">
                  {content.phone}
                </a>
              </span>
            </div>
            <div className="contact-item">
              <span className="contact-label">Email:</span>
              <span className="contact-value">
                <a href={`mailto:${content.email}`} className="contact-link">
                  {content.email}
                </a>
              </span>
            </div>
          </div>
          <div className="contacts-clean-map">
            <div className="map-minimal-frame">
              <img src={mapSrc} alt="Схема проезда" className="map-minimal-img" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
