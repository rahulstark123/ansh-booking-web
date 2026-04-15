import Razorpay from "razorpay";

type RazorpayConfig = {
  keyId: string;
  keySecret: string;
  proPlanAmountPaisa: number;
};

export function getRazorpayConfig(): RazorpayConfig | null {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim() || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() || "";
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";
  const amountRaw = process.env.RAZORPAY_PRO_PLAN_AMOUNT_PAISA?.trim() || "39900";
  const proPlanAmountPaisa = Number(amountRaw);
  if (!keyId || !keySecret || !Number.isFinite(proPlanAmountPaisa) || proPlanAmountPaisa <= 0) {
    return null;
  }
  return { keyId, keySecret, proPlanAmountPaisa: Math.trunc(proPlanAmountPaisa) };
}

export function getRazorpayInstance(config: RazorpayConfig): Razorpay {
  return new Razorpay({ key_id: config.keyId, key_secret: config.keySecret });
}
