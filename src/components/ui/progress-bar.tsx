import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  trackClassName,
  indicatorClassName,
}: {
  /** 0–1 (clamped) */
  value: number;
  className?: string;
  trackClassName?: string;
  indicatorClassName?: string;
}) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-gh-surface-inset ring-1 ring-gh-border-subtle",
        trackClassName,
        className,
      )}
      role="progressbar"
      aria-valuenow={Math.round(v * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full bg-gh-accent motion-reduce:transition-none",
          "transition-[width] duration-300 ease-out",
          indicatorClassName,
        )}
        style={{ width: `${v * 100}%` }}
      />
    </div>
  );
}
