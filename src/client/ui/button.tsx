import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-ink text-white shadow-card hover:-translate-y-0.5",
        variant === "secondary" &&
          "bg-white/80 text-ink ring-1 ring-ink/10 hover:bg-white",
        variant === "ghost" &&
          "bg-transparent text-ink hover:bg-ink/5",
        className,
      )}
      {...props}
    />
  );
}
