import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function Card({
  children,
  className,
  id,
}: PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section id={id} className={cn("panel p-5 sm:p-7", className)}>
      {children}
    </section>
  );
}
