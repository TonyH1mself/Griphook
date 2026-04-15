"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type EntryActionState = { error?: string };

export async function createEntry(_prev: EntryActionState, formData: FormData): Promise<EntryActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const transaction_type = formData.get("transaction_type") === "income" ? "income" : "expense";
  const amount = Number.parseFloat(String(formData.get("amount") || ""));
  const title = String(formData.get("title") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;
  const category_id = String(formData.get("category_id") || "");
  const bucketRaw = String(formData.get("bucket_id") || "");
  const bucket_id = bucketRaw && bucketRaw !== "none" ? bucketRaw : null;
  const occurred_at = String(formData.get("occurred_at") || "");

  if (!title) return { error: "Title is required." };
  if (!Number.isFinite(amount) || amount < 0) return { error: "Amount must be a non-negative number." };
  if (!category_id) return { error: "Category is required." };
  if (!occurred_at) return { error: "Date is required." };

  const { error } = await supabase.from("entries").insert({
    transaction_type,
    amount,
    title,
    notes,
    occurred_at: new Date(occurred_at).toISOString(),
    created_by_user_id: user.id,
    category_id,
    bucket_id,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  revalidatePath("/app/entries");
  redirect("/app/entries");
}
