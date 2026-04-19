-- Optional per-event-type meeting fee (Razorpay today; more providers later).
ALTER TABLE "booking_event_types" ADD COLUMN "payment_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "booking_event_types" ADD COLUMN "payment_provider" TEXT;
ALTER TABLE "booking_event_types" ADD COLUMN "payment_amount_paisa" INTEGER;
ALTER TABLE "booking_event_types" ADD COLUMN "payment_label" TEXT;

-- Guest Razorpay payment linkage for paid bookings
ALTER TABLE "booked_meetings" ADD COLUMN "razorpay_payment_id" TEXT;
ALTER TABLE "booked_meetings" ADD COLUMN "razorpay_order_id" TEXT;
CREATE UNIQUE INDEX "booked_meetings_razorpay_payment_id_key" ON "booked_meetings"("razorpay_payment_id");
