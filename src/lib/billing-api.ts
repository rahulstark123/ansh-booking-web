export type BillingSummary = {
  plan: "FREE" | "PRO";
  activeSubscription: {
    id: string;
    plan: "FREE" | "PRO";
    status: "PENDING" | "ACTIVE" | "CANCELLED" | "EXPIRED" | "PAST_DUE";
    provider: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    startedAt: string | null;
    createdAt: string;
  } | null;
  transactions: Array<{
    id: string;
    status: "CREATED" | "SUCCESS" | "FAILED";
    amount: number;
    currency: string;
    provider: string;
    description: string | null;
    providerPaymentId: string | null;
    paidAt: string | null;
    createdAt: string;
  }>;
};

export async function fetchBillingSummary(accessToken: string): Promise<BillingSummary> {
  const res = await fetch("/api/billing/summary", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to load billing summary");
  }
  return (await res.json()) as BillingSummary;
}
