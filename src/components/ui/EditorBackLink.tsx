interface EditorBackLinkProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function EditorBackLink({ label, onClick, disabled }: EditorBackLinkProps) {
  return (
    <div className="editor-header-nav">
      <a
        href="#"
        className="back-link"
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          event.preventDefault();
          if (disabled) return;
          onClick();
        }}
      >
        <span className="back-link-arrow" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </span>
        {label}
      </a>
    </div>
  );
}
