import { X } from "lucide-react";
import { useEffect, useId, useRef, type PropsWithChildren } from "react";

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
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // showModal() puts the dialog in the top layer, so it and its backdrop
  // cover the topbar.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="modal scroll-well"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && onClose()}
    >
      <header>
        <h2 id={titleId} className="cn-title">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="btn is-icon shrink-0"
        >
          <X />
        </button>
      </header>
      <div className="panel-body">{children}</div>
    </dialog>
  );
}
