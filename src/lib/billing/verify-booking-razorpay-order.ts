import type Razorpay from "razorpay";

type OrderNotes = Record<string, string> | null | undefined;

/**
 * Confirms the Razorpay order was created for this host/event/slot and matches the configured amount.
 */
export async function assertBookingRazorpayOrderValid(params: {
  razorpay: Razorpay;
  orderId: string;
  expectedAmountPaisa: number;
  hostId: string;
  eventId: string;
  startsAtIso: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Razorpay SDK typings are loose
    const order = (await params.razorpay.orders.fetch(params.orderId)) as {
      amount?: number | string;
      notes?: OrderNotes;
    };
    const amount = typeof order.amount === "string" ? Number(order.amount) : Number(order.amount);
    if (!Number.isFinite(amount) || amount !== params.expectedAmountPaisa) {
      return { ok: false, message: "Payment amount does not match this booking." };
    }
    const notes = order.notes;
    if (!notes || typeof notes !== "object") {
      return { ok: false, message: "Invalid payment order." };
    }
    if (String(notes.purpose) !== "booking") return { ok: false, message: "Invalid payment order." };
    if (String(notes.hostId) !== params.hostId) return { ok: false, message: "Invalid payment order." };
    if (String(notes.eventId) !== params.eventId) return { ok: false, message: "Invalid payment order." };
    if (String(notes.startsAt) !== params.startsAtIso) {
      return { ok: false, message: "Payment was for a different time slot." };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "Could not validate payment with Razorpay." };
  }
}
