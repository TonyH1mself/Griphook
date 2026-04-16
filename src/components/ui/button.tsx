import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

const interaction =
  "transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none active:scale-[0.98]";

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const base = cn(
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas disabled:pointer-events-none disabled:opacity-50",
    interaction,
  );
  const variants = {
    primary:
      "bg-gh-accent text-gh-canvas shadow-sm hover:bg-gh-accent-hover hover:shadow-gh-panel",
    secondary:
      "border border-gh-border bg-gh-surface-elevated text-gh-text shadow-sm hover:border-gh-text-muted/40 hover:bg-gh-surface",
    ghost: "text-gh-text-secondary hover:bg-gh-surface-elevated hover:text-gh-text",
  };
  return <button type={type} className={cn(base, variants[variant], className)} {...props} />;
}
