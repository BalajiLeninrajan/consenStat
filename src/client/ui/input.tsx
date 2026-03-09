import type { InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full border-4 border-black bg-white px-6 py-4 text-lg font-black uppercase text-black outline-none ring-0 transition placeholder:text-black/50 focus:bg-black/5",
        props.className,
      )}
      {...props}
    />
  );
}
