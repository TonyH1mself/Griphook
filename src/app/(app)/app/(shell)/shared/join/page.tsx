import { JoinBucketForm } from "@/components/shared/join-bucket-form";
import Link from "next/link";

export default function JoinSharedBucketPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/shared"
          className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
        >
          ← Shared
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Join a shared bucket
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter the numeric code you received from the bucket admin.
        </p>
      </div>
      <JoinBucketForm />
    </div>
  );
}
