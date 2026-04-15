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

export function AppSideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white/70 px-4 py-6 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70 md:flex">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">GripHook</p>
        <p className="mt-1 text-sm text-slate-500">Finance cockpit</p>
      </div>
      <nav className="mt-8 flex flex-1 flex-col gap-1" aria-label="Main">
        {links.map((l) => {
          const active = pathname === l.href || (l.href !== "/app" && pathname.startsWith(l.href));
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-xl px-3 py-2 text-sm font-medium",
                active
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
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
