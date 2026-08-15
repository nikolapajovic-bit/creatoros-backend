export const FREE_PLANS_LIMITS = {
  maxActiveDeals: 5,
  maxActiveContracts: 2,
  maxOpenConversations: 5,
} as const;

export function isUnderDealLimit(plan: string, currentCount: number): boolean {
  if (plan === "pro") return true;

  return currentCount < FREE_PLANS_LIMITS.maxActiveDeals;
}

export function isUnderContractLimit(
  plan: string,
  currentCount: number,
): boolean {
  if (plan === "pro") return true;

  return currentCount < FREE_PLANS_LIMITS.maxActiveContracts;
}

export function isUnderConversationLimit(
  plan: string,
  currentCount: number,
): boolean {
  if (plan === "pro") return true;

  return currentCount < FREE_PLANS_LIMITS.maxOpenConversations;
}
