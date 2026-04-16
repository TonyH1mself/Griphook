"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const RADIUS = 96;
/** Degrees from “up”: symmetric fan (negative = toward left). */
const FAN_DEG = [-44, -22, 0, 22, 44] as const;

const actions = [
  { href: "/app/entries/new", label: "Entry" },
  { href: "/app/buckets/new", label: "Bucket" },
  { href: "/app/recurring", label: "Repeat" },
  { href: "/app/shared/join", label: "Join" },
  { href: "/app/categories", label: "Tags" },
] as const;

function haptic() {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & { vibrate?: (n: number | number[]) => boolean };
  nav.vibrate?.(12);
}

function agentLog(message: string, data: Record<string, unknown>, hypothesisId: string) {
  // #region agent log
  fetch("http://127.0.0.1:7794/ingest/09b0aba0-4f5a-4ca4-8763-6c4f0cd89420", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "60d861" },
    body: JSON.stringify({
      sessionId: "60d861",
      location: "app-mobile-fab-menu.tsx",
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: "verify-fab",
    }),
  }).catch(() => {});
  // #endregion
}

export function AppMobileFabMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const w = typeof window !== "undefined" ? window.innerWidth : 0;
    agentLog("fab_mount", { innerWidth: w, belowMd: w < 768 }, "H2");
  }, []);

  useEffect(() => {
    if (!open) return;
    agentLog("fab_open", { innerWidth: window.innerWidth, pathname }, "H4");
  }, [open, pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = useCallback(() => {
    haptic();
    setOpen((o) => !o);
  }, []);

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-gh-canvas/50 backdrop-blur-[2px] md:hidden"
          aria-label="Close quick actions"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div
        className={cn(
          "pointer-events-none fixed z-[50] md:hidden",
          "bottom-[calc(5.35rem+env(safe-area-inset-bottom))] right-4",
        )}
      >
        <div className="pointer-events-auto relative h-14 w-14">
          {open
            ? actions.map((a, i) => {
                const deg = FAN_DEG[i] ?? 0;
                const rad = (deg * Math.PI) / 180;
                const x = Math.round(-Math.sin(rad) * RADIUS);
                const y = Math.round(-Math.cos(rad) * RADIUS);
                return (
                  <Link
                    key={a.href}
                    href={a.href}
                    prefetch
                    onClick={() => setOpen(false)}
                    className={cn(
                      "absolute left-1/2 top-1/2 flex h-11 min-w-[4.5rem] items-center justify-center rounded-2xl border border-gh-border-subtle bg-gh-surface-elevated px-3 text-center text-xs font-semibold text-gh-text shadow-gh-panel",
                      "motion-safe:transition-[transform,opacity] motion-safe:duration-200",
                      "focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
                    )}
                    style={{
                      transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                    }}
                  >
                    {a.label}
                  </Link>
                );
              })
            : null}
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "absolute bottom-0 right-0 flex h-14 w-14 items-center justify-center rounded-full border border-gh-accent/40 bg-gh-accent text-gh-canvas shadow-gh-panel",
              "motion-safe:transition-[transform,box-shadow] motion-safe:duration-200 motion-safe:active:scale-95 motion-reduce:transition-none",
              "focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
            )}
            aria-expanded={open}
            aria-haspopup="true"
            aria-label={open ? "Close quick actions" : "Open quick actions"}
          >
            <span
              className={cn(
                "text-2xl font-light leading-none motion-safe:transition-transform motion-safe:duration-200",
                open && "motion-safe:rotate-45",
              )}
              aria-hidden
            >
              +
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
