import type { Estimate, PresentationSlideId, PresentationSlides } from '../../types';

interface PresentationSlidesSelectorProps {
  estimate: Estimate;
  onChange: (patch: Partial<Estimate>) => void;
}

const SLIDE_OPTIONS: Array<{
  id: PresentationSlideId;
  title: string;
  description: string;
}> = [
  {
    id: 'about',
    title: 'Слайд «О компании»',
    description: 'Команда разработки, ключевые решения и экспертиза Аверс Технолоджи.',
  },
  {
    id: 'recognition',
    title: 'Слайд «Распознавание еды»',
    description: 'Презентация ИИ-технологии Умной Кассы для столовых.',
  },
];

function getSlides(estimate: Estimate): PresentationSlides {
  return {
    about: estimate.presentationSlides?.about === true,
    recognition: estimate.presentationSlides?.recognition === true,
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
        Выберите презентационные слайды, которые будут добавлены в итоговый PDF-документ перед
        таблицей расчётов.
      </p>
      <div className="presentation-slides-selector__grid">
        {SLIDE_OPTIONS.map((opt) => {
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
                aria-label={opt.title}
              />
              <div>
                <span className="slide-checkbox-card__title">{opt.title}</span>
                <span className="slide-checkbox-card__desc">{opt.description}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
