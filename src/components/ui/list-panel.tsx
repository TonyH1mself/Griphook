import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

/** Rounded list container: use with divide-y on children rows */
export function ListPanel({ className, ...props }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul
      className={cn(
        "divide-y divide-gh-border-subtle overflow-hidden rounded-2xl border border-gh-border-subtle bg-gh-surface/85 shadow-gh-panel backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}
