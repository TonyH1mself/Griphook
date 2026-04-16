import { cn } from "@/lib/utils";
import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

const interaction =
  "transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none active:scale-[0.98]";

const variants = {
  primary: cn(
    "bg-gh-accent text-gh-canvas shadow-sm hover:bg-gh-accent-hover hover:shadow-gh-panel",
    "outline-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
  ),
  secondary: cn(
    "border border-gh-border bg-gh-surface-elevated text-gh-text shadow-sm hover:border-gh-text-muted/40 hover:bg-gh-surface",
    "outline-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
  ),
} as const;

export function LinkButton({
  href,
  className,
  variant = "primary",
  children,
  ...props
}: LinkProps & { children: ReactNode; className?: string; variant?: keyof typeof variants }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium",
        interaction,
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
