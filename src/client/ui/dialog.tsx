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
    <div className="scrim fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="popover page-enter w-full max-w-lg"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color-mix(in_srgb,var(--surface-1)_40%,transparent)] bg-[color-mix(in_srgb,var(--crust)_30%,var(--mantle))] px-5 py-4">
          <h2 className="section-title">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="btn-ghost -mr-2 h-8 min-h-0 w-8 shrink-0 rounded-[9px] p-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto p-5 scroll-well">
          {children}
        </div>
      </div>
    </div>
  );
}
