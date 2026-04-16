import { BucketForm } from "@/components/buckets/bucket-form";
import Link from "next/link";

export default function NewBucketPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/buckets"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Buckets
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">New bucket</h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          Shared buckets get a 6-digit join code automatically.
        </p>
      </div>
      <BucketForm />
    </div>
  );
}
