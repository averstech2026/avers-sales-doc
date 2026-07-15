import type { ReactNode } from 'react';

interface CornerFrameProps {
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function CornerFrame({ children, className = '', accent = false }: CornerFrameProps) {
  return (
    <div className={`corner-frame ${accent ? 'corner-frame--accent' : ''} ${className}`}>
      <span className="corner corner-tl" />
      <span className="corner corner-tr" />
      <span className="corner corner-bl" />
      <span className="corner corner-br" />
      <div className="corner-frame__content">{children}</div>
    </div>
  );
}
