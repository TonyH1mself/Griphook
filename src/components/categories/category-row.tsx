"use client";

import { CategoryArchiveToggle } from "@/components/categories/category-archive-toggle";
import { CategoryEditForm } from "@/components/categories/category-edit-form";
import { useState } from "react";

/**
 * Slim row for a user-owned category. Shows just the name by default; the
 * edit form and archive action only appear when the user opts in via
 * "Bearbeiten". This trades permanent per-row controls for quieter scanning.
 */
export function CategoryRow({
  categoryId,
  name,
  isArchived,
}: {
  categoryId: string;
  name: string;
  isArchived: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <li
      className={
        isArchived
          ? "rounded-2xl border border-gh-border-subtle bg-gh-surface-inset/40 px-4 py-3 ring-1 ring-gh-border-subtle"
          : "rounded-2xl border border-gh-border-subtle bg-gh-surface/85 px-4 py-3 shadow-gh-panel backdrop-blur-sm"
      }
    >
      <div className="flex items-center justify-between gap-3">
        <p
          className={
            isArchived
              ? "truncate text-sm font-medium text-gh-text-secondary"
              : "truncate text-sm font-medium text-gh-text"
          }
        >
          {name}
        </p>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={`cat-row-${categoryId}`}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-gh-text-muted transition-colors hover:text-gh-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gh-ring"
        >
          {open ? "Schließen" : "Bearbeiten"}
        </button>
      </div>
      {open ? (
        <div
          id={`cat-row-${categoryId}`}
          className="mt-3 flex flex-col gap-3 border-t border-gh-border-subtle pt-3 sm:flex-row sm:items-start sm:justify-between"
        >
          {isArchived ? (
            <p className="text-xs text-gh-text-muted sm:max-w-xs">
              Archiviert — in Auswahllisten ausgeblendet.
            </p>
          ) : (
            <CategoryEditForm categoryId={categoryId} initialName={name} />
          )}
          <CategoryArchiveToggle categoryId={categoryId} isArchived={isArchived} />
        </div>
      ) : null}
    </li>
  );
}
