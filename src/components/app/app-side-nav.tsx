"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBrandDots } from "./nav-icons";
import { primaryNav, secondaryNav, type NavItem } from "./nav-items";

const navInteraction =
  "transition-[background-color,color,border-color,transform] duration-150 ease-out motion-reduce:transition-none motion-reduce:transform-none";

function SideLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium outline-none",
        navInteraction,
        "focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-surface",
        item.emphasis
          ? active
            ? "border-gh-accent/50 bg-gh-accent text-gh-canvas"
            : "border-gh-accent/40 bg-gh-accent/90 text-gh-canvas hover:bg-gh-accent"
          : active
            ? "border-gh-accent/35 bg-gh-accent-muted text-gh-accent"
            : "border-transparent text-gh-text-secondary hover:border-gh-border-subtle hover:bg-gh-surface-elevated hover:text-gh-text active:scale-[0.99]",
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
              : "text-gh-text-muted group-hover:text-gh-text-secondary",
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

export function AppSideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gh-border-subtle bg-gh-surface/75 px-4 py-6 shadow-gh-panel backdrop-blur-md md:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gh-accent/30 bg-gh-accent/15 text-gh-accent">
          <IconBrandDots size={18} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold tracking-tight text-gh-text">GripHook</p>
          <p className="truncate text-[11px] uppercase tracking-wider text-gh-text-muted">
            Finance cockpit
          </p>
        </div>
      </div>

      <nav className="mt-7 flex flex-1 flex-col" aria-label="Primary">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gh-text-muted">
          Main
        </p>
        <div className="flex flex-col gap-1">
          {primaryNav.map((item) => (
            <SideLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
        </div>

        <p className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-gh-text-muted">
          More
        </p>
        <div className="flex flex-col gap-1">
          {secondaryNav.map((item) => (
            <SideLink key={item.href} item={item} active={item.match(pathname)} />
          ))}
        </div>
      </nav>
    </aside>
  );
}
