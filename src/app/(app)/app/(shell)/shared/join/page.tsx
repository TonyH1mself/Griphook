import { JoinBucketForm } from "@/components/shared/join-bucket-form";
import Link from "next/link";

export default function JoinSharedBucketPage() {
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
          Gemeinsamem Bucket beitreten
        </h1>
        <p className="mt-1 text-sm text-gh-text-muted">
          Gib den 6-stelligen Code ein, den du vom Bucket-Admin erhalten hast.
        </p>
      </div>
      <JoinBucketForm />
    </div>
  );
}
