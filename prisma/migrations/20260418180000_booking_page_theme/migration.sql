-- Public booking page visual theme per event type (host-configurable).
ALTER TABLE "booking_event_types"
ADD COLUMN IF NOT EXISTS "booking_page_theme" TEXT NOT NULL DEFAULT 'simple';
