"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type StatusKey = "active" | "archived" | "all";

type Option = { key: StatusKey; label: string; href: string };

/**
 * Overflow menu that replaces the permanent status chip row on the buckets
 * overview. Keeps the same three filters reachable without claiming a full
 * row of permanent UI.
 */
export function BucketsStatusMenu({
  active,
  options,
}: {
  active: StatusKey;
  options: readonly Option[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (e.target instanceof Node && rootRef.current.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeLabel = options.find((o) => o.key === active)?.label ?? "Status";

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Status-Filter: ${activeLabel}`}
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gh-border bg-gh-surface-elevated/80 text-gh-text-secondary shadow-sm outline-none transition-[background-color,color,border-color] duration-150 hover:border-gh-text-muted/40 hover:bg-gh-surface hover:text-gh-text focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas motion-reduce:transition-none",
          active !== "active" && "border-gh-accent/40 text-gh-accent",
        )}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="currentColor"
          className="shrink-0"
        >
          <circle cx="5" cy="12" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="19" cy="12" r="1.75" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Status-Filter"
          className="absolute right-0 z-40 mt-2 min-w-40 overflow-hidden rounded-xl border border-gh-border-subtle bg-gh-surface-elevated/95 shadow-gh-panel backdrop-blur-md"
        >
          <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gh-text-muted">
            Status
          </p>
          <ul className="pb-1">
            {options.map((opt) => (
              <li key={opt.key}>
                <Link
                  href={opt.href}
                  role="menuitemradio"
                  aria-checked={opt.key === active}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3 py-2 text-sm outline-none transition-colors",
                    opt.key === active
                      ? "bg-gh-accent-muted text-gh-accent"
                      : "text-gh-text-secondary hover:bg-gh-surface hover:text-gh-text",
                    "focus-visible:bg-gh-surface focus-visible:text-gh-text",
                  )}
                >
                  <span>{opt.label}</span>
                  {opt.key === active ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M5 12l4 4 10-10"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
