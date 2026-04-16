"use client";

import { BucketBudgetForm } from "@/components/buckets/bucket-budget-form";
import { BucketMetaForm } from "@/components/buckets/bucket-meta-form";
import { archiveBucket, regenerateJoinCode } from "@/server/bucket-actions";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";

type BucketSummary = {
  id: string;
  name: string;
  description: string | null;
  type: "private" | "shared";
  has_budget: boolean;
  budget_amount: string | number | null;
  budget_period: string;
};

type DialogKind = "meta" | "budget" | null;

export function BucketActionsMenu({
  bucket,
  canRegenerateJoinCode = false,
}: {
  bucket: BucketSummary;
  canRegenerateJoinCode?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ kind: "info" | "error"; text: string } | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const closeMenu = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        !menuRef.current?.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        closeMenu();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMenu();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(null), 4500);
    return () => window.clearTimeout(t);
  }, [feedback]);

  const openDialog = (kind: Exclude<DialogKind, null>) => {
    setDialog(kind);
    setOpen(false);
  };

  const handleArchive = () => {
    if (
      !window.confirm(
        `„${bucket.name}“ archivieren? Du kannst ihn jederzeit unter Buckets → Archiviert wiederherstellen.`,
      )
    )
      return;
    setOpen(false);
    setFeedback(null);
    startTransition(async () => {
      const r = await archiveBucket(bucket.id);
      if (r.error) {
        setFeedback({ kind: "error", text: r.error });
        return;
      }
      router.push("/app/buckets");
      router.refresh();
    });
  };

  const handleRegenerate = () => {
    setOpen(false);
    setFeedback(null);
    startTransition(async () => {
      const r = await regenerateJoinCode(bucket.id);
      if (r && "error" in r && r.error) {
        setFeedback({ kind: "error", text: r.error });
        return;
      }
      if (r && "join_code" in r && r.join_code) {
        setFeedback({ kind: "info", text: `Neuer Beitrittscode: ${r.join_code}` });
      }
      router.refresh();
    });
  };

  return (
    <div className="relative inline-flex flex-col items-end">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Bucket-Aktionen"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gh-border bg-gh-surface-elevated text-gh-text-secondary shadow-sm",
          "outline-none transition-[background-color,border-color,color,box-shadow] duration-150",
          "hover:border-gh-text-muted/40 hover:bg-gh-surface hover:text-gh-text",
          "focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
          "disabled:pointer-events-none disabled:opacity-50",
        )}
      >
        <KebabIcon />
      </button>

      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Bucket verwalten"
          className={cn(
            "absolute right-0 top-12 z-30 w-64 origin-top-right overflow-hidden rounded-2xl border border-gh-border-subtle",
            "bg-gh-surface-elevated/95 shadow-gh-panel ring-1 ring-black/5 backdrop-blur",
          )}
        >
          <ul className="py-1">
            <MenuItem onSelect={() => openDialog("meta")}>Details bearbeiten</MenuItem>
            <MenuItem onSelect={() => openDialog("budget")}>Budget verwalten</MenuItem>
            {canRegenerateJoinCode ? (
              <MenuItem onSelect={handleRegenerate} disabled={pending}>
                Beitrittscode neu erzeugen
              </MenuItem>
            ) : null}
            <li className="my-1 border-t border-gh-border-subtle" role="separator" />
            <MenuItem onSelect={handleArchive} disabled={pending} tone="danger">
              Bucket archivieren
            </MenuItem>
          </ul>
        </div>
      ) : null}

      {feedback ? (
        <p
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "mt-2 max-w-xs rounded-xl border px-3 py-2 text-xs",
            feedback.kind === "error"
              ? "border-gh-danger/40 bg-gh-danger-soft text-gh-error-text"
              : "border-gh-border-subtle bg-gh-surface text-gh-text-muted",
          )}
        >
          {feedback.text}
        </p>
      ) : null}

      <Dialog
        open={dialog === "meta"}
        title="Details bearbeiten"
        description="Name und Beschreibung dieses Buckets."
        onClose={() => setDialog(null)}
      >
        <BucketMetaForm
          bucketId={bucket.id}
          name={bucket.name}
          description={bucket.description}
          onSuccess={() => setDialog(null)}
        />
      </Dialog>

      <Dialog
        open={dialog === "budget"}
        title="Budget verwalten"
        description="Monatsbudget für Ausgaben in diesem Bucket."
        onClose={() => setDialog(null)}
      >
        <BucketBudgetForm
          bucketId={bucket.id}
          hasBudget={bucket.has_budget}
          budgetAmount={bucket.budget_amount}
          budgetPeriod={bucket.budget_period}
          onSuccess={() => setDialog(null)}
        />
      </Dialog>
    </div>
  );
}

function MenuItem({
  children,
  onSelect,
  disabled = false,
  tone = "default",
}: {
  children: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <li role="none">
      <button
        role="menuitem"
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-start px-4 py-3 text-left text-sm transition-colors duration-150",
          "outline-none focus-visible:bg-gh-surface focus-visible:text-gh-text",
          "disabled:pointer-events-none disabled:opacity-50",
          tone === "danger"
            ? "text-gh-danger hover:bg-gh-danger-soft"
            : "text-gh-text hover:bg-gh-surface",
        )}
      >
        {children}
      </button>
    </li>
  );
}

function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>(
        "input,textarea,select,button,[tabindex]:not([tabindex='-1'])",
      ) ?? dialogRef.current;
    focusTarget?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 px-3 py-6 backdrop-blur-sm sm:items-center sm:px-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "w-full max-w-md rounded-2xl border border-gh-border-subtle bg-gh-surface-elevated p-5 shadow-gh-panel",
          "max-h-[85vh] overflow-y-auto outline-none",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold tracking-tight text-gh-text">
              {title}
            </h2>
            {description ? (
              <p id={descId} className="mt-1 text-xs text-gh-text-muted">
                {description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Dialog schließen"
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-xl text-gh-text-muted",
              "outline-none transition-colors duration-150 hover:bg-gh-surface hover:text-gh-text",
              "focus-visible:ring-2 focus-visible:ring-gh-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gh-canvas",
            )}
          >
            <CloseIcon />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function KebabIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="6" r="1.7" />
      <circle cx="12" cy="12" r="1.7" />
      <circle cx="12" cy="18" r="1.7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6l12 12" />
      <path d="M18 6L6 18" />
    </svg>
  );
}
