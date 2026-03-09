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
        "inline-flex items-center justify-center font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-black text-[#ff3e00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(255,62,0,1)]",
        variant === "secondary" &&
          "bg-[#ff3e00] text-black border-2 border-black hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]",
        variant === "ghost" &&
          "bg-transparent text-black hover:bg-black/5 border-2 border-transparent",
        className,
      )}
      {...props}
    />
  );
}
