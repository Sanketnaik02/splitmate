export function calcEqualSplit(amount, memberIds) {
  if (!memberIds.length) return {};
  const share = amount / memberIds.length;
  const result = {};
  memberIds.forEach((id) => { result[id] = share; });
  return result;
}

export function calcPercentageSplit(amount, percentagesByUserId) {
  const result = {};
  Object.entries(percentagesByUserId).forEach(([userId, pct]) => {
    result[userId] = (amount * pct) / 100;
  });
  return result;
}

export function calcExactSplit(amountsByUserId) {
  return { ...amountsByUserId };
}

export function calcSharesSplit(amount, sharesByUserId) {
  const totalShares = Object.values(sharesByUserId).reduce((s, v) => s + v, 0);
  if (totalShares === 0) {
    const result = {};
    Object.keys(sharesByUserId).forEach((id) => { result[id] = 0; });
    return result;
  }
  const result = {};
  Object.entries(sharesByUserId).forEach(([userId, shares]) => {
    result[userId] = (amount * shares) / totalShares;
  });
  return result;
}

export function getSplitLabel(type) {
  const labels = { equal: 'Equal', percentage: 'Percentage', exact: 'Custom', shares: 'Shares' };
  return labels[type] || type;
}

export function computeGroupBalances(members, expenses, settlements) {
  const balances = {};
  members.forEach((m) => { balances[m.userId] = 0; });
  console.log('[computeGroupBalances] members userIds:', members.map(m => ({ id: m.id, userId: m.userId, displayName: m.displayName, userIdType: typeof m.userId, userIdStrictNull: m.userId === null })));
  console.log('[computeGroupBalances] initial balance keys:', Object.keys(balances));

  expenses.forEach((exp) => {
    if (exp.paid_by_member_id !== undefined && exp.splits) {
      const payerMember = members.find(m => m.id === exp.paid_by_member_id);
      console.log('[computeGroupBalances] new-shape expense:', { desc: exp.description, amount: exp.amount, paid_by_member_id: exp.paid_by_member_id, payerMemberId: payerMember?.id, payerUserId: payerMember?.userId, payerUserIdType: typeof payerMember?.userId });
      if (payerMember && balances[payerMember.userId] !== undefined)
        balances[payerMember.userId] += Number(exp.amount);
      (exp.splits || []).forEach((s) => {
        const splitMember = members.find(m => m.id === s.member_id);
        console.log('[computeGroupBalances] split:', { member_id: s.member_id, share_amount: s.share_amount, splitMemberId: splitMember?.id, splitUserId: splitMember?.userId, splitUserIdType: typeof splitMember?.userId });
        if (splitMember && balances[splitMember.userId] !== undefined)
          balances[splitMember.userId] -= Number(s.share_amount);
      });
    } else {
      console.log('[computeGroupBalances] old-shape expense:', { desc: exp.description, amount: exp.amount, paidBy: exp.paidBy, paidByType: typeof exp.paidBy });
      if (balances[exp.paidBy] !== undefined) balances[exp.paidBy] += exp.amount;
      if (exp.splitDetails) {
        Object.entries(exp.splitDetails).forEach(([uid, share]) => {
          console.log('[computeGroupBalances] old-shape split:', { uid, uidType: typeof uid, share });
          if (balances[uid] !== undefined) balances[uid] -= share;
        });
      }
    }
  });

  settlements
    .filter((s) => s.status === 'completed')
    .forEach((s) => {
      console.log('[computeGroupBalances] settlement:', { fromUserId: s.fromUserId, fromUserIdType: typeof s.fromUserId, toUserId: s.toUserId, toUserIdType: typeof s.toUserId, amount: s.amount });
      if (balances[s.fromUserId] !== undefined) balances[s.fromUserId] += s.amount;
      if (balances[s.toUserId] !== undefined) balances[s.toUserId] -= s.amount;
    });

  console.log('[computeGroupBalances] final balances:', JSON.parse(JSON.stringify(balances)));
  return balances;
}

export function simplifyDebts(balances) {
  const creditors = [];
  const debtors = [];

  Object.entries(balances).forEach(([userId, balance]) => {
    const r = Math.round(balance * 100) / 100;
    if (r > 0.01) creditors.push({ userId, amount: r });
    else if (r < -0.01) debtors.push({ userId, amount: -r });
  });

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const txns = [];
  let ci = 0; let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const amt = Math.min(creditors[ci].amount, debtors[di].amount);
    txns.push({ from: debtors[di].userId, to: creditors[ci].userId, amount: Math.round(amt * 100) / 100 });
    console.log('[simplifyDebts] txn:', { from: debtors[di].userId, fromType: typeof debtors[di].userId, to: creditors[ci].userId, toType: typeof creditors[ci].userId, amount: amt });
    creditors[ci].amount -= amt;
    debtors[di].amount -= amt;
    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return txns;
}

export function computeUserOverallBalance(userId, groups, allExpenses, allSettlements) {
  let totalOwed = 0;
  let totalOwes = 0;
  let totalExpenses = 0;
  let totalPaid = 0;

  groups.forEach((g) => {
    const members = g.members || [];
    const groupExpenses = allExpenses.filter((e) => (e.group_id || e.groupId) === g.id);
    const groupSettlements = allSettlements.filter((s) => s.groupId === g.id);
    const balances = computeGroupBalances(members, groupExpenses, groupSettlements);
    const bal = balances[userId] || 0;
    if (bal > 0) totalOwed += bal;
    else totalOwes += Math.abs(bal);
    groupExpenses.forEach((e) => {
      totalExpenses += Number(e.amount);
      if (e.paid_by_member_id !== undefined) {
        const payerMember = members.find(m => m.id === e.paid_by_member_id);
        if (payerMember?.userId === userId) totalPaid += Number(e.amount);
      } else if (e.paidBy === userId) {
        totalPaid += Number(e.amount);
      }
    });
  });

  return { totalOwed, totalOwes, net: totalOwed - totalOwes, totalExpenses, totalPaid };
}
