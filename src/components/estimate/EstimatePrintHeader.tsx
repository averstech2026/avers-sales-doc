import { AVERS_LOGO_WHITE } from '../../utils/clientLogo';

interface EstimatePrintHeaderProps {
  clientLogoSrc: string | null;
  className?: string;
}

export function EstimatePrintHeader({ clientLogoSrc, className = '' }: EstimatePrintHeaderProps) {
  return (
    <header className={`estimate-print-header ${className}`.trim()}>
      <div className="estimate-print-header__logo estimate-print-header__logo--avers">
        <img src={AVERS_LOGO_WHITE} alt="Аверс Технолоджи" />
      </div>
      {clientLogoSrc && (
        <div className="estimate-print-header__logo estimate-print-header__logo--client">
          <img src={clientLogoSrc} alt="Логотип заказчика" />
        </div>
      )}
    </header>
  );
}
