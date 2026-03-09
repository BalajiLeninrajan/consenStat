import { cn } from "../lib/cn";

export function Progress({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className={cn("h-4 overflow-hidden rounded-full bg-ink/10", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-lagoon to-coral transition-all duration-500"
        style={{ width: `${Math.max(4, Math.min(100, value))}%` }}
      />
    </div>
  );
}
