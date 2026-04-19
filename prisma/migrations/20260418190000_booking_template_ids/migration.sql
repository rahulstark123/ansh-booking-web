-- Layout template IDs (was palette-only names). Normalize existing rows.
UPDATE "booking_event_types"
SET "booking_page_theme" = 'simple'
WHERE "booking_page_theme" IS NULL
   OR "booking_page_theme" IN ('default', 'aurora', 'ocean', 'sunset', 'forest', 'midnight')
   OR "booking_page_theme" NOT IN ('simple', 'vintage', 'modern', 'compact', 'editorial');

ALTER TABLE "booking_event_types" ALTER COLUMN "booking_page_theme" SET DEFAULT 'simple';
