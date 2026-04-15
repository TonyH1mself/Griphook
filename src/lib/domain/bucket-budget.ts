/** Remaining budget for a bucket in the MVP monthly model (expenses only). */
export function remainingBucketBudget(
  budgetAmount: number | string | null | undefined,
  budgetPeriod: string,
  expenseTotalInPeriod: number,
): number | null {
  if (budgetPeriod !== "monthly") return null;
  if (budgetAmount == null) return null;
  const cap = typeof budgetAmount === "string" ? Number.parseFloat(budgetAmount) : budgetAmount;
  if (!Number.isFinite(cap)) return null;
  return Math.max(0, cap - expenseTotalInPeriod);
}
