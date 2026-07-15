import { CornerFrame } from '../ui/CornerFrame';
import { formatCurrency, formatNumber } from '../../utils/calculator';
import type { EstimateTotals } from '../../types';

interface SummaryCardsProps {
  totals: EstimateTotals;
}

export function SummaryCards({ totals }: SummaryCardsProps) {
  const cards = [
    { label: 'Итого с НДС', value: formatCurrency(totals.totalWithVat), accent: true },
    { label: 'Без НДС', value: formatCurrency(totals.subtotal) },
    { label: 'НДС 5%', value: formatCurrency(totals.vat) },
    { label: 'Всего часов', value: formatNumber(totals.totalHours) },
  ];

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <CornerFrame key={card.label} accent={card.accent} className="summary-card">
          <div className="summary-card__label">{card.label}</div>
          <div className={`summary-card__value ${card.accent ? 'summary-card__value--accent' : ''}`}>
            {card.value}
          </div>
        </CornerFrame>
      ))}
    </div>
  );
}
