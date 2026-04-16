import { AppArcNav } from "@/components/app/app-arc-nav";
import { AppSideNav } from "@/components/app/app-side-nav";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1">
      <AppSideNav />
      <div className="flex min-h-full min-w-0 flex-1 flex-col pb-[calc(env(safe-area-inset-bottom)+6rem)] md:pb-0">
        <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 md:px-8 md:py-10">{children}</div>
      </div>
      <AppArcNav />
    </div>
  );
}
