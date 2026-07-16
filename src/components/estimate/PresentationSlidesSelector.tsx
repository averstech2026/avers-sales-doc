import type { Estimate, PresentationSlideId, PresentationSlides } from '../../types';
import { PRESENTATION_SLIDE_DEFS } from '../../utils/presentationSlides';

interface PresentationSlidesSelectorProps {
  estimate: Estimate;
  onChange: (patch: Partial<Estimate>) => void;
}

function getSlides(estimate: Estimate): PresentationSlides {
  return {
    about: estimate.presentationSlides?.about === true,
    recognition: estimate.presentationSlides?.recognition === true,
    kiosk: estimate.presentationSlides?.kiosk === true,
    contacts: estimate.presentationSlides?.contacts === true,
  };
}

export function PresentationSlidesSelector({
  estimate,
  onChange,
}: PresentationSlidesSelectorProps) {
  const slides = getSlides(estimate);

  const toggle = (id: PresentationSlideId) => {
    onChange({
      presentationSlides: {
        ...slides,
        [id]: !slides[id],
      },
    });
  };

  return (
    <div className="presentation-slides-selector">
      <h3 className="presentation-slides-selector__title">Конструктор коммерческого предложения</h3>
      <p className="presentation-slides-selector__hint">
        Выберите слайды для встраивания в PDF: маркетинговые блоки появятся на первой странице
        сразу после шапки (до итоговых карточек). Блок «Контакты» — под подписями в конце документа.
      </p>
      <div className="presentation-slides-selector__grid">
        {PRESENTATION_SLIDE_DEFS.map((opt) => {
          const checked = slides[opt.id];
          return (
            <label
              key={opt.id}
              className={`slide-checkbox-card${checked ? ' slide-checkbox-card--active' : ''}`}
            >
              <input
                type="checkbox"
                className="slide-checkbox"
                checked={checked}
                onChange={() => toggle(opt.id)}
                aria-label={opt.menuTitle}
              />
              <div>
                <span className="slide-checkbox-card__title">Слайд «{opt.menuTitle}»</span>
                <span className="slide-checkbox-card__desc">{opt.menuDescription}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
