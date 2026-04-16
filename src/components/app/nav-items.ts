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
  /** Matcher für den Aktiv-Zustand (die Route, zu der dieses Item gehört). */
  match: (pathname: string) => boolean;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** Hervorgehobene Aktion (Akzent-Füllung). */
  emphasis?: boolean;
};

const startsWith = (prefix: string) => (p: string) =>
  p === prefix || p.startsWith(`${prefix}/`);

/**
 * Primäre Navigation — bewusst auf 5 Einträge begrenzt, damit das mobile
 * Arc-Menü nie überladen wirkt. Auf Desktop zusätzlich durch Settings/Sekundär
 * ergänzt (siehe `tertiaryNav` und Sidebar).
 */
export const primaryNav: readonly NavItem[] = [
  { href: "/app", label: "Start", match: (p) => p === "/app", icon: IconDashboard },
  {
    href: "/app/entries",
    label: "Einträge",
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
    label: "Geteilt",
    match: (p) => p === "/app/shared" || p.startsWith("/app/shared/"),
    icon: IconShared,
  },
  {
    href: "/app/entries/new",
    label: "Neu",
    match: (p) => p === "/app/entries/new",
    icon: IconAdd,
    emphasis: true,
  },
] as const;

/** Sekundäre Navigation — Desktop-Sidebar, mobile über Topbar/Settings. */
export const secondaryNav: readonly NavItem[] = [
  {
    href: "/app/recurring",
    label: "Wiederkehrend",
    match: startsWith("/app/recurring"),
    icon: IconRecurring,
  },
  {
    href: "/app/categories",
    label: "Kategorien",
    match: startsWith("/app/categories"),
    icon: IconCategories,
  },
] as const;

/** Tertiäre Navigation — Settings, Profil etc. */
export const tertiaryNav: readonly NavItem[] = [
  {
    href: "/app/settings",
    label: "Einstellungen",
    match: startsWith("/app/settings"),
    icon: IconSettings,
  },
] as const;
