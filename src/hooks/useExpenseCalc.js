import { useMemo } from 'react';
import { computeGroupBalances, simplifyDebts } from '../utils/calculators';
import { getDisplayName } from '../utils/displayName';

export default function useExpenseCalc(members, expenses, settlements) {
  const balances = useMemo(
    () => computeGroupBalances(members, expenses, settlements),
    [members, expenses, settlements]
  );

  const suggestedPayments = useMemo(
    () => simplifyDebts(balances),
    [balances]
  );

  const getMemberName = (userId) => getDisplayName(userId, members);

  return { balances, suggestedPayments, getMemberName };
}
