import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function Badge({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex border-2 border-black bg-white text-black px-4 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]",
        className,
      )}
    >
      {children}
    </span>
  );
}
