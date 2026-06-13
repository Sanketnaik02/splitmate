import { useMemo } from 'react';
import { computeGroupBalances, simplifyDebts } from '../utils/calculators';

export default function useExpenseCalc(members, expenses, settlements) {
  const balances = useMemo(
    () => computeGroupBalances(members, expenses, settlements),
    [members, expenses, settlements]
  );

  const suggestedPayments = useMemo(
    () => simplifyDebts(balances),
    [balances]
  );

  const getMemberName = (userId) => {
    const m = members.find((m) => m.userId === userId);
    return m?.displayName || userId;
  };

  return { balances, suggestedPayments, getMemberName };
}
