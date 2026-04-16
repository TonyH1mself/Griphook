import type { ComponentType, SVGProps } from "react";
import {
  IconAdd,
  IconBuckets,
  IconCategories,
  IconDashboard,
  IconEntries,
  IconSettings,
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
 * Primäre Navigation — bewusst auf 4 Einträge begrenzt. Shared Buckets sind
 * nicht mehr ein eigener Menüpunkt, sondern in den Bucket-Bereich integriert
 * (Beitritt per Code sitzt als sekundärer CTA auf der Bucket-Übersicht).
 * Auf Desktop zusätzlich durch Settings/Sekundär ergänzt (siehe `tertiaryNav`).
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
    href: "/app/entries/new",
    label: "Neu",
    match: (p) => p === "/app/entries/new",
    icon: IconAdd,
    emphasis: true,
  },
] as const;

/**
 * Sekundäre Navigation — Desktop-Sidebar, mobile über Topbar/Settings.
 * Wiederkehrend ist bewusst kein eigener Nav-Eintrag mehr: Verwaltung liegt
 * unter Einstellungen, so bleibt die Sidebar auf tägliche Nutzung fokussiert.
 */
export const secondaryNav: readonly NavItem[] = [
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
