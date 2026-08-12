import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function Badge({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return <span className={cn("chip", className)}>{children}</span>;
}
