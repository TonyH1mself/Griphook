import { redirect } from "next/navigation";

export default async function SharedBucketDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/app/buckets/${id}`);
}
