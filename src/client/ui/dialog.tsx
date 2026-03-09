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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg border-4 border-black bg-white p-5 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] sm:border-8 sm:p-10 sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
        <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6 sm:gap-6">
          <h2 className="font-theme-display text-2xl font-black uppercase leading-none tracking-tighter text-black sm:text-4xl">{title}</h2>
          <Button 
            className="border-2 border-black bg-white px-3 py-2 text-sm text-black hover:bg-black/5 sm:px-4" 
            onClick={onClose}
          >
            X
          </Button>
        </div>
        <div className="text-black">
          {children}
        </div>
      </div>
    </div>
  );
}
