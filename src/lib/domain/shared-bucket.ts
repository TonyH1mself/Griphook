export type SharedMemberLike = { user_id: string; share_percent: number | string };

export type SharedExpenseLike = {
  created_by_user_id: string;
  amount: number | string;
  transaction_type: string;
};

function toNumber(n: number | string) {
  return typeof n === "string" ? Number.parseFloat(n) : n;
}

/**
 * Soll/Ist per member: Soll = totalExpenses * share_percent/100; Ist = sum of expenses that member created.
 */
export function sharedBucketBreakdown(members: SharedMemberLike[], entries: SharedExpenseLike[]) {
  const expenses = entries.filter((e) => e.transaction_type === "expense");
  const total = expenses.reduce((s, e) => s + toNumber(e.amount), 0);

  const actualByUser = new Map<string, number>();
  for (const e of expenses) {
    const amt = toNumber(e.amount);
    actualByUser.set(e.created_by_user_id, (actualByUser.get(e.created_by_user_id) ?? 0) + amt);
  }

  return members.map((m) => {
    const pct = toNumber(m.share_percent);
    const shareAmount = total * (pct / 100);
    const actualAmount = actualByUser.get(m.user_id) ?? 0;
    return {
      userId: m.user_id,
      sharePercent: pct,
      shareAmount,
      actualAmount,
      delta: actualAmount - shareAmount,
    };
  });
}
