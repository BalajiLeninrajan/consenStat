import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-2xl border border-ink/10 bg-white/80 px-4 py-3 text-sm text-ink outline-none ring-0 transition placeholder:text-ink/40 focus:border-lagoon focus:bg-white",
        props.className,
      )}
      {...props}
    />
  );
}
