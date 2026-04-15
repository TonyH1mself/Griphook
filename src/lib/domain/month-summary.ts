export type MonthEntryLike = {
  transaction_type: "income" | "expense";
  amount: number | string;
  occurred_at: string;
};

export function monthBounds(reference: Date) {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function toNumber(amount: number | string) {
  return typeof amount === "string" ? Number.parseFloat(amount) : amount;
}

/** Sums income, expense, and balance for entries whose occurred_at falls in reference’s calendar month. */
export function summarizeMonth(entries: MonthEntryLike[], reference = new Date()) {
  const { start, end } = monthBounds(reference);
  let income = 0;
  let expense = 0;

  for (const e of entries) {
    const d = new Date(e.occurred_at);
    if (Number.isNaN(d.getTime()) || d < start || d > end) continue;
    const n = toNumber(e.amount);
    if (e.transaction_type === "income") income += n;
    else expense += n;
  }

  return { income, expense, balance: income - expense };
}
