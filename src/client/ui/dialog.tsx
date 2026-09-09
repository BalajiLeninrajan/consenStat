import { X } from "lucide-react";
import type { PropsWithChildren } from "react";

export function Dialog({
  open,
  title,
  onClose,
  children,
}: PropsWithChildren<{
  open: boolean;
  title: string;
  onClose: () => void;
}>) {
  if (!open) {
    return null;
  }

  return (
    <div className="cn-scrim">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="modal scroll-well"
      >
        <header>
          <h2 className="cn-title">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="btn-icon shrink-0"
          >
            <X />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
