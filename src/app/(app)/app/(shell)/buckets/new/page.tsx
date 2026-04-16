import { BucketForm } from "@/components/buckets/bucket-form";
import Link from "next/link";

export default async function NewBucketPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const defaultType: "private" | "shared" = sp.type === "shared" ? "shared" : "private";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/buckets"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Buckets
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">
          {defaultType === "shared" ? "Neuer gemeinsamer Bucket" : "Neuer Bucket"}
        </h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          {defaultType === "shared"
            ? "Für Haushalt, Reise oder kleine Gruppen. Beitrittscode wird automatisch erzeugt."
            : "Privat nur für dich — optional mit Monatsbudget."}
        </p>
      </div>
      <BucketForm defaultType={defaultType} />
    </div>
  );
}
