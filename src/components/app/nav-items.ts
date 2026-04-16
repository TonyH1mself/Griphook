import type { ComponentType, SVGProps } from "react";
import {
  IconAdd,
  IconBuckets,
  IconCategories,
  IconDashboard,
  IconEntries,
  IconRecurring,
  IconSettings,
  IconShared,
} from "./nav-icons";

export type NavItem = {
  href: string;
  label: string;
  /** Matcher for active state (the route the item owns). */
  match: (pathname: string) => boolean;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** Emphasized action, rendered with accent fill. */
  emphasis?: boolean;
};

const startsWith = (prefix: string) => (p: string) =>
  p === prefix || p.startsWith(`${prefix}/`);

/**
 * Primary navigation — identical order mobile + desktop.
 * Kept intentionally short (6) so the arc menu never feels crowded.
 */
export const primaryNav: readonly NavItem[] = [
  { href: "/app", label: "Dashboard", match: (p) => p === "/app", icon: IconDashboard },
  {
    href: "/app/entries",
    label: "Entries",
    match: (p) =>
      p !== "/app/entries/new" && (p === "/app/entries" || p.startsWith("/app/entries/")),
    icon: IconEntries,
  },
  {
    href: "/app/buckets",
    label: "Buckets",
    match: (p) => p === "/app/buckets" || p.startsWith("/app/buckets/"),
    icon: IconBuckets,
  },
  {
    href: "/app/shared",
    label: "Shared",
    match: (p) => p === "/app/shared" || p.startsWith("/app/shared/"),
    icon: IconShared,
  },
  {
    href: "/app/entries/new",
    label: "Add",
    match: (p) => p === "/app/entries/new",
    icon: IconAdd,
    emphasis: true,
  },
  { href: "/app/settings", label: "Settings", match: startsWith("/app/settings"), icon: IconSettings },
] as const;

/** Secondary navigation — only surfaced on desktop sidebar or in-context. */
export const secondaryNav: readonly NavItem[] = [
  { href: "/app/recurring", label: "Recurring", match: startsWith("/app/recurring"), icon: IconRecurring },
  {
    href: "/app/categories",
    label: "Categories",
    match: startsWith("/app/categories"),
    icon: IconCategories,
  },
] as const;
