import Razorpay from "razorpay";

export type RazorpayKeyPair = {
  keyId: string;
  keySecret: string;
};

type RazorpayConfig = RazorpayKeyPair & {
  proPlanAmountPaisa: number;
};

/** Standard Razorpay SDK instance (host meeting fees or platform billing). */
export function getRazorpayInstanceFromKeys(keys: RazorpayKeyPair): Razorpay {
  return new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });
}

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
  return getRazorpayInstanceFromKeys(config);
}
