import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

const STANDARD_SLIDE_WIDTH = 1123;
const STANDARD_SLIDE_HEIGHT = 794;
const CONTACTS_SLIDE_WIDTH = 794;

interface ScaledSlideFrameProps {
  children: ReactNode;
  variant?: 'standard' | 'contacts';
  className?: string;
}

export function ScaledSlideFrame({
  children,
  variant = 'standard',
  className = '',
}: ScaledSlideFrameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.6);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const baseWidth =
      variant === 'contacts' ? CONTACTS_SLIDE_WIDTH : STANDARD_SLIDE_WIDTH;

    const syncScale = () => {
      const width = container.clientWidth;
      if (width <= 0) return;
      setScale(Math.min(1, width / baseWidth));
    };

    syncScale();

    const observer = new ResizeObserver(syncScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [variant]);

  if (variant === 'contacts') {
    return (
      <div ref={containerRef} className={`scaled-slide-frame ${className}`.trim()}>
        <div className="scaled-slide-frame__contacts">{children}</div>
      </div>
    );
  }

  const viewportWidth = STANDARD_SLIDE_WIDTH * scale;
  const viewportHeight = STANDARD_SLIDE_HEIGHT * scale;

  return (
    <div ref={containerRef} className={`scaled-slide-frame ${className}`.trim()}>
      <div
        className="scaled-slide-frame__viewport"
        style={{ width: viewportWidth, height: viewportHeight }}
      >
        <div
          className="scaled-slide-frame__inner"
          style={{
            width: STANDARD_SLIDE_WIDTH,
            height: STANDARD_SLIDE_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
