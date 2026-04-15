import { cn } from "@/lib/utils";
import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";

const variants = {
  primary:
    "bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100",
  secondary:
    "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:hover:bg-slate-800",
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
        "inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
