import { JoinBucketForm } from "@/components/shared/join-bucket-form";
import Link from "next/link";

export default function JoinSharedBucketPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/shared"
          className="text-sm font-medium text-gh-text-muted transition-colors hover:text-gh-accent"
        >
          ← Shared
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-gh-text">
          Join a shared bucket
        </h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          Enter the numeric code you received from the bucket admin.
        </p>
      </div>
      <JoinBucketForm />
    </div>
  );
}
