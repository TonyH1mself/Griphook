"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type MemberSharesState = { error?: string; ok?: boolean };

function friendlyError(error: { message?: string; code?: string }): string {
  if (error.code === "42501" || /permission denied|rls/i.test(error.message ?? "")) {
    return "Du hast keine Berechtigung, die Anteile zu ändern.";
  }
  return error.message ?? "Anteile konnten nicht gespeichert werden.";
}

export async function updateBucketMemberShares(
  _prev: MemberSharesState,
  formData: FormData,
): Promise<MemberSharesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Nicht angemeldet." };

  const bucketId = String(formData.get("bucket_id") ?? "").trim();
  if (!bucketId) return { error: "Bucket fehlt." };

  const { data: admin } = await supabase
    .from("bucket_members")
    .select("role")
    .eq("bucket_id", bucketId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (admin?.role !== "admin") {
    return { error: "Nur Admins können Anteile ändern." };
  }

  const { data: members } = await supabase
    .from("bucket_members")
    .select("user_id")
    .eq("bucket_id", bucketId);

  if (!members?.length) return { error: "Keine Mitglieder gefunden." };

  const pairs: { userId: string; pct: number }[] = [];
  for (const m of members) {
    const raw = String(formData.get(`share_${m.user_id}`) ?? "").trim().replace(",", ".");
    const n = Number.parseFloat(raw);
    if (!Number.isFinite(n))
      return { error: "Bitte für jedes Mitglied eine gültige Zahl angeben." };
    if (n < 0 || n > 100) return { error: "Jeder Anteil muss zwischen 0 und 100 % liegen." };
    pairs.push({ userId: m.user_id, pct: n });
  }

  const sum = pairs.reduce((s, p) => s + p.pct, 0);
  if (Math.abs(sum - 100) > 0.02) {
    return { error: `Anteile müssen 100 % ergeben (aktuell ${sum.toFixed(1)} %).` };
  }

  for (const p of pairs) {
    const { error } = await supabase
      .from("bucket_members")
      .update({ share_percent: p.pct })
      .eq("bucket_id", bucketId)
      .eq("user_id", p.userId);
    if (error) return { error: friendlyError(error) };
  }

  revalidatePath(`/app/buckets/${bucketId}`);
  revalidatePath("/app/buckets");
  return { ok: true };
}
