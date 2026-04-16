"use client";

import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function IconRefresh({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20 12a8 8 0 1 1-2.34-5.66" />
      <path d="M20 4v4.8h-4.8" />
    </svg>
  );
}

/**
 * Snappy refresh trigger. Uses `router.refresh()` so server components and
 * RSC data revalidate without a full page reload. A short visual spin loop
 * plus haptic bump give predictable feedback even on slow connections.
 */
export function AppRefreshButton({
  variant = "icon",
  className,
}: {
  variant?: "icon" | "wide";
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [spinning, setSpinning] = useState(false);

  const busy = isPending || spinning;

  function trigger() {
    if (busy) return;
    setSpinning(true);
    if (typeof window !== "undefined") {
      const nav = window.navigator as Navigator & { vibrate?: (n: number) => boolean };
      nav.vibrate?.(8);
    }
    startTransition(() => {
      router.refresh();
    });
    window.setTimeout(() => setSpinning(false), 650);
  }

  if (variant === "wide") {
    return (
      <button
        type="button"
        onClick={trigger}
        aria-busy={busy}
        className={cn(
          "group inline-flex min-h-11 items-center gap-2 rounded-xl border border-transparent px-3 text-sm font-medium text-gh-text-secondary outline-none transition-[background-color,color,border-color] duration-150 hover:border-gh-border-subtle hover:bg-gh-surface-elevated hover:text-gh-text motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-surface",
          className,
        )}
      >
        <IconRefresh
          size={16}
          className={cn(
            "text-gh-text-muted transition-transform duration-150 group-hover:text-gh-text-secondary motion-reduce:transition-none",
            busy && "motion-safe:animate-spin",
          )}
        />
        <span>{busy ? "Aktualisiert…" : "Aktualisieren"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={trigger}
      aria-label={busy ? "Aktualisiert" : "Aktualisieren"}
      aria-busy={busy}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-xl border border-gh-border-subtle bg-gh-surface-elevated/90 text-gh-text-secondary shadow-[0_6px_18px_-10px_rgb(0_0_0/0.6)] outline-none transition-[background-color,color,border-color,transform] duration-150 hover:border-gh-border hover:text-gh-text motion-safe:active:scale-[0.94] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
        className,
      )}
    >
      <IconRefresh
        size={18}
        className={cn("transition-transform duration-150", busy && "motion-safe:animate-spin")}
      />
    </button>
  );
}
