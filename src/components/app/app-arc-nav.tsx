"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconBrandDots, IconClose } from "./nav-icons";
import { primaryNav } from "./nav-items";

const TRIGGER_SIZE = 56;
/** Angle sweep: from straight up (-90°) to right (0°). */
const ARC_START = -90;
const ARC_END = 0;
/** Responsive radius; sized so pills never exceed a typical 360px viewport. */
const ARC_RADIUS = "clamp(130px, 34vw, 156px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767.98px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

function haptic(duration: number) {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & { vibrate?: (n: number | number[]) => boolean };
  nav.vibrate?.(duration);
}

function ArcNavInner() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLAnchorElement | null>(null);

  const items = primaryNav;
  const count = items.length;

  const angles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) =>
        count === 1 ? (ARC_START + ARC_END) / 2 : ARC_START + (i * (ARC_END - ARC_START)) / (count - 1),
      ),
    [count],
  );

  const close = useCallback(() => {
    setOpen((prev) => {
      if (prev) haptic(10);
      return false;
    });
  }, []);

  const toggle = useCallback(() => {
    setOpen((prev) => {
      haptic(prev ? 10 : 8);
      return !prev;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => {
      firstItemRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-44 bg-gh-canvas/55 backdrop-blur-[3px] md:hidden",
          "transition-opacity duration-200 ease-out motion-reduce:transition-none",
          open ? "pointer-events-auto opacity-100" : "opacity-0",
        )}
        aria-hidden="true"
        onClick={close}
      />

      <div
        className="pointer-events-none fixed z-50 md:hidden"
        style={{
          left: "calc(env(safe-area-inset-left) + 1rem)",
          bottom: "calc(env(safe-area-inset-bottom) + 1.25rem)",
        }}
      >
        <div
          className="pointer-events-auto relative"
          style={{ width: TRIGGER_SIZE, height: TRIGGER_SIZE }}
        >
          <nav aria-label="Primary" id="primary-arc" className="absolute inset-0">
            <ul className="contents">
              {items.map((item, i) => {
                const Icon = item.icon;
                const angle = angles[i];
                const rad = (angle * Math.PI) / 180;
                const active = item.match(pathname);
                const xFactor = Math.cos(rad).toFixed(4);
                const yFactor = Math.sin(rad).toFixed(4);

                const itemStyle: React.CSSProperties = {
                  left: "50%",
                  top: "50%",
                  transitionDelay: open ? `${i * 24}ms` : `${(count - 1 - i) * 14}ms`,
                  transform: open
                    ? `translate(calc(${ARC_RADIUS} * ${xFactor} - 50%), calc(${ARC_RADIUS} * ${yFactor} - 50%)) scale(1)`
                    : `translate(-50%, -50%) scale(0.7)`,
                  opacity: open ? 1 : 0,
                };

                return (
                  <li key={item.href} className="absolute">
                    <Link
                      ref={i === 0 ? firstItemRef : undefined}
                      href={item.href}
                      prefetch
                      aria-current={active ? "page" : undefined}
                      tabIndex={open ? 0 : -1}
                      aria-hidden={open ? undefined : true}
                      onClick={() => {
                        haptic(6);
                        setOpen(false);
                      }}
                      style={itemStyle}
                      className={cn(
                        "group absolute flex h-11 min-w-28 items-center gap-2 rounded-2xl border px-3.5 text-xs font-semibold outline-none",
                        "shadow-[0_10px_30px_-10px_rgb(0_0_0/0.55),0_1px_0_rgb(255_255_255/0.05)_inset]",
                        "transition-[transform,opacity,background-color,color,border-color] duration-220 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        "motion-reduce:transition-opacity motion-reduce:duration-150",
                        "focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
                        !open && "pointer-events-none",
                        item.emphasis
                          ? active
                            ? "border-gh-accent/60 bg-gh-accent text-gh-canvas"
                            : "border-gh-accent/50 bg-gh-accent text-gh-canvas hover:bg-gh-accent-hover"
                          : active
                            ? "border-gh-accent/40 bg-gh-accent-muted text-gh-accent"
                            : "border-gh-border-subtle bg-gh-surface-elevated/95 text-gh-text hover:border-gh-border",
                      )}
                    >
                      <Icon
                        size={18}
                        className={cn(
                          "shrink-0",
                          item.emphasis
                            ? ""
                            : active
                              ? "text-gh-accent"
                              : "text-gh-text-secondary group-hover:text-gh-text",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <button
            ref={triggerRef}
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-controls="primary-arc"
            aria-label={open ? "Close primary navigation" : "Open primary navigation"}
            className={cn(
              "relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border outline-none",
              "shadow-[0_14px_34px_-10px_rgb(0_0_0/0.7),0_1px_0_rgb(255_255_255/0.12)_inset]",
              "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out",
              "motion-safe:active:scale-[0.94] motion-reduce:transition-none",
              "focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
              open
                ? "border-gh-border bg-gh-surface-elevated text-gh-text motion-safe:scale-[1.04]"
                : "border-gh-accent/45 bg-gh-accent text-gh-canvas hover:bg-gh-accent-hover",
            )}
          >
            <span className="relative flex h-[22px] w-[22px] items-center justify-center" aria-hidden>
              <IconBrandDots
                size={22}
                className={cn(
                  "absolute transition-[opacity,transform] duration-200 ease-out",
                  "motion-reduce:transition-none",
                  open ? "-rotate-45 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                )}
              />
              <IconClose
                size={22}
                className={cn(
                  "absolute transition-[opacity,transform] duration-200 ease-out",
                  "motion-reduce:transition-none",
                  open ? "rotate-0 scale-100 opacity-100" : "rotate-45 scale-75 opacity-0",
                )}
              />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

/**
 * Mobile-only primary navigation rendered as a radial/arc speed-dial
 * anchored to the bottom-left safe area.
 *
 * Route-change → remount via `key={pathname}` — resets open state without
 * triggering set-state-in-effect warnings.
 */
export function AppArcNav() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  if (!isMobile) return null;
  return <ArcNavInner key={pathname} />;
}
