import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-[96px] w-full rounded-xl border border-gh-border bg-gh-surface-inset px-3 py-2.5 text-sm text-gh-text shadow-[inset_0_1px_2px_rgb(0_0_0/0.2)] outline-none placeholder:text-gh-text-muted",
        "transition-[border-color,box-shadow] duration-150 ease-out focus:border-gh-accent/50 focus:ring-2 focus:ring-gh-ring/35 motion-reduce:transition-none",
        className,
      )}
      {...props}
    />
  );
}
