import { BucketForm } from "@/components/buckets/bucket-form";
import Link from "next/link";

export default function NewBucketPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/app/buckets" className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
          ← Buckets
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">New bucket</h1>
        <p className="mt-1 text-sm text-slate-500">Shared buckets get a 6-digit join code automatically.</p>
      </div>
      <BucketForm />
    </div>
  );
}
