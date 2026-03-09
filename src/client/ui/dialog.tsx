import type { PropsWithChildren } from "react";
import { Button } from "./button";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-card">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-ink">{title}</h2>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
