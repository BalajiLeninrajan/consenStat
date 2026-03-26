import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function Card({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("theme-card p-8 shadow-card", className)}>
      {children}
    </section>
  );
}
