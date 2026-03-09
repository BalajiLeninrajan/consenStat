import { cn } from "../lib/cn";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-6 overflow-hidden border-4 border-black bg-white", className)}>
      <div
        className="h-full bg-[var(--accent-color)] transition-all duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
