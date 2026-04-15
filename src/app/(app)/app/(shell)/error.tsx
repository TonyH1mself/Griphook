"use client";

import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Something went wrong</h2>
      <p className="mt-2 text-sm text-slate-500">{error.message || "Please try again."}</p>
      <Button type="button" className="mt-6" variant="secondary" onClick={() => reset()}>
        Retry
      </Button>
    </div>
  );
}
