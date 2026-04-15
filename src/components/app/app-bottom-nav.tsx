"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/app", label: "Home", match: (p: string) => p === "/app" },
  { href: "/app/entries", label: "Entries", match: (p: string) => p.startsWith("/app/entries") },
  { href: "/app/buckets", label: "Buckets", match: (p: string) => p.startsWith("/app/buckets") },
  { href: "/app/shared", label: "Shared", match: (p: string) => p.startsWith("/app/shared") },
  { href: "/app/recurring", label: "Repeat", match: (p: string) => p.startsWith("/app/recurring") },
  { href: "/app/settings", label: "More", match: (p: string) => p.startsWith("/app/settings") },
] as const;

function hapticTap() {
  if (typeof window === "undefined") return;
  const nav = window.navigator as Navigator & { vibrate?: (n: number | number[]) => boolean };
  nav.vibrate?.(10);
}

export function AppBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 md:hidden"
      aria-label="Main"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1 px-2">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                prefetch
                onPointerDown={() => hapticTap()}
                className={cn(
                  "flex min-h-12 min-w-[44px] flex-col items-center justify-center rounded-2xl px-1 py-2 text-[11px] font-medium transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.96]",
                  active
                    ? "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
                    : "text-slate-500 hover:bg-slate-100/90 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900/80 dark:hover:text-slate-200",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
