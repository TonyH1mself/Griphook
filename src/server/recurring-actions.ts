"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type RecurringActionState = { error?: string };

export async function createRecurringTemplate(
  _prev: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
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
  const frequency = String(formData.get("frequency") || "monthly");
  const next_due_at = String(formData.get("next_due_at") || "");

  if (!title) return { error: "Title is required." };
  if (!Number.isFinite(amount) || amount < 0) return { error: "Amount must be a non-negative number." };
  if (!category_id) return { error: "Category is required." };
  if (!next_due_at) return { error: "Next due date is required." };

  const { error } = await supabase.from("recurring_entry_templates").insert({
    created_by_user_id: user.id,
    bucket_id,
    category_id,
    transaction_type,
    amount,
    title,
    notes,
    frequency,
    next_due_at: new Date(next_due_at).toISOString(),
    is_active: true,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/recurring");
  redirect("/app/recurring");
}
