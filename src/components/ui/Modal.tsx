import type { ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  /** Extra-wide layout for document previews (A4 sheet). */
  preview?: boolean;
}

export function Modal({ open, onClose, title, children, wide, preview }: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      // mousedown (not click): selecting text in a field and releasing outside
      // would otherwise fire click on the overlay and close the modal.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? 'modal--wide' : ''} ${preview ? 'modal--preview' : ''}`.trim()}
      >
        <div className="modal__header">
          <h2>{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
            ×
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
