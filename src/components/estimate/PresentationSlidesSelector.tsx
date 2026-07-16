import { useEffect, useState } from 'react';
import type { Estimate, PresentationSlideId, PresentationSlides } from '../../types';
import { loadPresentationSlidesLibrary } from '../../services/presentationSlides';
import {
  PRESENTATION_SLIDE_DEFS,
  normalizePresentationSlidesSelection,
  type CustomPresentationSlide,
} from '../../utils/presentationSlides';

interface PresentationSlidesSelectorProps {
  estimate: Estimate;
  onChange: (patch: Partial<Estimate>) => void;
}

function getSlides(estimate: Estimate): PresentationSlides {
  return normalizePresentationSlidesSelection(estimate.presentationSlides);
}

export function PresentationSlidesSelector({
  estimate,
  onChange,
}: PresentationSlidesSelectorProps) {
  const slides = getSlides(estimate);
  const [customSlides, setCustomSlides] = useState<CustomPresentationSlide[]>([]);

  useEffect(() => {
    let cancelled = false;
    void loadPresentationSlidesLibrary().then((library) => {
      if (!cancelled) setCustomSlides(library.customSlides ?? []);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const commit = (next: PresentationSlides) => {
    onChange({ presentationSlides: next });
  };

  const toggleBuiltin = (id: PresentationSlideId) => {
    commit({
      ...slides,
      [id]: !slides[id],
    });
  };

  const toggleCustom = (id: string) => {
    const selected = new Set(slides.customIds ?? []);
    if (selected.has(id)) selected.delete(id);
    else selected.add(id);
    commit({
      ...slides,
      customIds: [...selected],
    });
  };

  const builtinMarketing = PRESENTATION_SLIDE_DEFS.filter((opt) => opt.id !== 'contacts');
  const contactsDef = PRESENTATION_SLIDE_DEFS.find((opt) => opt.id === 'contacts');

  return (
    <div className="presentation-slides-selector">
      <h3 className="presentation-slides-selector__title">Конструктор коммерческого предложения</h3>
      <p className="presentation-slides-selector__hint">
        Выберите слайды для встраивания в PDF: маркетинговые блоки появятся на первой странице
        сразу после шапки (до итоговых карточек). Блок «Контакты» объединён с подписями в единый подвал документа.
      </p>
      <div className="presentation-slides-selector__grid">
        {builtinMarketing.map((opt) => {
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
                onChange={() => toggleBuiltin(opt.id)}
                aria-label={opt.menuTitle}
              />
              <div>
                <span className="slide-checkbox-card__title">Слайд «{opt.menuTitle}»</span>
                <span className="slide-checkbox-card__desc">{opt.menuDescription}</span>
              </div>
            </label>
          );
        })}

        {customSlides.map((slide) => {
          const checked = (slides.customIds ?? []).includes(slide.id);
          return (
            <label
              key={slide.id}
              className={`slide-checkbox-card${checked ? ' slide-checkbox-card--active' : ''}`}
            >
              <input
                type="checkbox"
                className="slide-checkbox"
                checked={checked}
                onChange={() => toggleCustom(slide.id)}
                aria-label={slide.menuTitle}
              />
              <div>
                <span className="slide-checkbox-card__title">Слайд «{slide.menuTitle}»</span>
                <span className="slide-checkbox-card__desc">{slide.menuDescription}</span>
              </div>
            </label>
          );
        })}

        {contactsDef ? (
          <label
            key={contactsDef.id}
            className={`slide-checkbox-card${slides.contacts ? ' slide-checkbox-card--active' : ''}`}
          >
            <input
              type="checkbox"
              className="slide-checkbox"
              checked={slides.contacts}
              onChange={() => toggleBuiltin('contacts')}
              aria-label={contactsDef.menuTitle}
            />
            <div>
              <span className="slide-checkbox-card__title">Слайд «{contactsDef.menuTitle}»</span>
              <span className="slide-checkbox-card__desc">{contactsDef.menuDescription}</span>
            </div>
          </label>
        ) : null}
      </div>
    </div>
  );
}
