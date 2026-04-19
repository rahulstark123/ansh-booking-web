/** Values persisted on `BookingEventType.paymentProvider` */
export type MeetingPaymentProviderId = "razorpay";

export const DEFAULT_MEETING_PAYMENT_PROVIDER: MeetingPaymentProviderId = "razorpay";

/** UI chips: first entry is the only selectable provider today. */
export const MEETING_PAYMENT_PROVIDER_CHIPS: Array<{
  key: string;
  label: string;
  providerId: MeetingPaymentProviderId | null;
  disabled?: boolean;
  hint?: string;
}> = [
  { key: "razorpay", label: "Razorpay", providerId: "razorpay" },
  {
    key: "soon",
    label: "More options",
    providerId: null,
    disabled: true,
    hint: "Stripe and more — soon",
  },
];
