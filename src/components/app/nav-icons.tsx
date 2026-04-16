import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Base({ size = 20, children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconDashboard(p: IconProps) {
  return (
    <Base {...p}>
      <rect x="3.5" y="3.5" width="7.5" height="8.5" rx="1.6" />
      <rect x="13" y="3.5" width="7.5" height="5.5" rx="1.6" />
      <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.6" />
      <rect x="13" y="10.5" width="7.5" height="10" rx="1.6" />
    </Base>
  );
}

export function IconEntries(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 6.5h14" />
      <path d="M5 12h14" />
      <path d="M5 17.5h9" />
      <circle cx="3.6" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="3.6" cy="12" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="3.6" cy="17.5" r="0.8" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconBuckets(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 7.5c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Z" />
      <path d="M4 7.5v3.25c0 1.1 3.6 2 8 2s8-.9 8-2V7.5" />
      <path d="M4 12.75V16c0 1.1 3.6 2 8 2s8-.9 8-2v-3.25" />
    </Base>
  );
}

export function IconShared(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="9" cy="9" r="3.2" />
      <circle cx="16.5" cy="10.5" r="2.4" />
      <path d="M3.5 19.5c.8-2.9 3-4.5 5.5-4.5s4.7 1.6 5.5 4.5" />
      <path d="M15 16c1.8 0 3.4 1.1 4 3.5" />
    </Base>
  );
}

export function IconAdd(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M12 5.5v13" />
      <path d="M5.5 12h13" />
    </Base>
  );
}

export function IconSettings(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M4 7.5h9" />
      <path d="M17 7.5h3" />
      <path d="M4 16.5h3" />
      <path d="M11 16.5h9" />
      <circle cx="15" cy="7.5" r="2" />
      <circle cx="9" cy="16.5" r="2" />
    </Base>
  );
}

export function IconRecurring(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5 12a7 7 0 0 1 11.8-5.1L20 10" />
      <path d="M20 5v5h-5" />
      <path d="M19 12a7 7 0 0 1-11.8 5.1L4 14" />
      <path d="M4 19v-5h5" />
    </Base>
  );
}

export function IconCategories(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M5.5 5.5h6.25L20 13.75l-6.75 6.75L5.5 12.25V5.5Z" />
      <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconBrandDots(p: IconProps) {
  return (
    <Base {...p}>
      <circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="7" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="7" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconClose(p: IconProps) {
  return (
    <Base {...p}>
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </Base>
  );
}
