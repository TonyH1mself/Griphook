"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app", label: "Dashboard" },
  { href: "/app/entries", label: "Entries" },
  { href: "/app/buckets", label: "Buckets" },
  { href: "/app/shared", label: "Shared" },
  { href: "/app/shared/join", label: "Join bucket" },
  { href: "/app/recurring", label: "Recurring" },
  { href: "/app/categories", label: "Categories" },
  { href: "/app/settings", label: "Settings" },
] as const;

const navInteraction =
  "transition-[background-color,color,transform] duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none";

export function AppSideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gh-border-subtle bg-gh-surface/75 px-4 py-6 shadow-gh-panel backdrop-blur-md md:flex">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gh-text-muted">GripHook</p>
        <p className="mt-1 text-sm text-gh-text-secondary">Finance cockpit</p>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/app" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-surface",
                navInteraction,
                active
                  ? "bg-gh-accent-muted text-gh-accent shadow-[inset_0_0_0_1px_rgb(106_158_148/0.35)]"
                  : "text-gh-text-secondary hover:bg-gh-surface-elevated hover:text-gh-text active:scale-[0.99]",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
