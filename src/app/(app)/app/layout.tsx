export const dynamic = "force-dynamic";

export default function AppAreaLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-full flex-1 pt-safe">{children}</div>;
}
