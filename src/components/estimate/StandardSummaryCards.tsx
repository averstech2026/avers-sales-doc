import { CornerFrame } from '../ui/CornerFrame';
import { formatCurrency } from '../../utils/calculator';
import type { StandardEstimateTotals } from '../../types';

interface StandardSummaryCardsProps {
  totals: StandardEstimateTotals;
}

export function StandardSummaryCards({ totals }: StandardSummaryCardsProps) {
  const vatLabel = `${Math.round(totals.vatRate * 100)}%`;

  const cards = [
    {
      label: 'Единоразово (с НДС)',
      value: formatCurrency(totals.oneTimeWithVat),
      accent: true,
    },
    {
      label: 'Аренда / месяц',
      value: `${formatCurrency(totals.recurringMonthly)} / мес.`,
      accent: false,
    },
    {
      label: `НДС (${vatLabel})`,
      value: formatCurrency(totals.vat),
      accent: false,
    },
    {
      label: 'Всего позиций',
      value: String(totals.itemCount),
      accent: false,
    },
  ];

  return (
    <div className="summary-cards standard-summary-cards">
      {cards.map((card) => (
        <CornerFrame key={card.label} accent={card.accent} className="summary-card">
          <div className="summary-card__label">{card.label}</div>
          <div
            className={`summary-card__value ${card.accent ? 'summary-card__value--accent' : ''}`}
          >
            {card.value}
          </div>
        </CornerFrame>
      ))}
    </div>
  );
}
