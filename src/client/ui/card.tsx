import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section
      className={cn(
        "rounded-[2rem] border border-white/60 bg-white/70 p-6 shadow-card backdrop-blur",
        className,
      )}
    >
      {children}
    </section>
  );
}
