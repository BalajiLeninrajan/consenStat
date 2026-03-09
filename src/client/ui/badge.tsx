import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function Badge({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full bg-gold/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink/80",
        className,
      )}
    >
      {children}
    </span>
  );
}
