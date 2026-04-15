import { remainingBucketBudget } from "@/lib/domain";

export type BudgetHealthRow = {
  bucketId: string;
  name: string;
  spent: number;
  cap: number;
  remaining: number | null;
  ratio: number;
  status: "ok" | "tight" | "over";
};

/** ratio = spent/cap when cap > 0 */
export function budgetHealthRows(
  buckets: {
    id: string;
    name: string;
    has_budget: boolean;
    budget_period: string;
    budget_amount: unknown;
  }[],
  expensesByBucketId: Map<string, number>,
): BudgetHealthRow[] {
  const rows: BudgetHealthRow[] = [];
  for (const b of buckets) {
    if (!b.has_budget || b.budget_period !== "monthly" || b.budget_amount == null) continue;
    const cap = Number(b.budget_amount);
    if (!Number.isFinite(cap) || cap <= 0) continue;
    const spent = expensesByBucketId.get(b.id) ?? 0;
    const remaining = remainingBucketBudget(cap, "monthly", spent);
    const ratio = spent / cap;
    let status: BudgetHealthRow["status"] = "ok";
    if (ratio >= 1) status = "over";
    else if (ratio >= 0.85) status = "tight";
    rows.push({
      bucketId: b.id,
      name: b.name,
      spent,
      cap,
      remaining,
      ratio: Math.min(ratio, 1.5),
      status,
    });
  }
  return rows.sort((a, b) => {
    if (a.status === "over" && b.status !== "over") return -1;
    if (b.status === "over" && a.status !== "over") return 1;
    if (a.status === "tight" && b.status === "ok") return -1;
    if (b.status === "tight" && a.status === "ok") return 1;
    return b.ratio - a.ratio;
  });
}
