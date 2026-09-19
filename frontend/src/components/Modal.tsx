import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface ModalProps {
  titleId: string;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

// Center popup used for the sidebar's Quick Links and Help actions. Closes on
// Escape or a backdrop click, and moves focus to its close button on open so
// keyboard users land somewhere predictable instead of on the page behind it.
export function Modal({ titleId, title, onClose, children }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-lg flex-col gap-6 overflow-y-auto rounded-lg border-4 border-ink bg-paper p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-extrabold text-primary">
            {title}
          </h2>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="닫기"
            className="flex min-h-[48px] min-w-[48px] shrink-0 items-center justify-center rounded-lg border-4 border-ink text-xl font-extrabold transition-colors hover:bg-ink hover:text-paper focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
