import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gh-border bg-gh-surface/50 px-6 py-14 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]">
      <p className="text-base font-medium text-gh-text">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gh-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
