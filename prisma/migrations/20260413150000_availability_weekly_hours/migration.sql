-- CreateTable
CREATE TABLE "availability_weekly_hours" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_weekly_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "availability_weekly_hours_hostId_wid_dayOfWeek_key" ON "availability_weekly_hours"("hostId", "wid", "dayOfWeek");

-- CreateIndex
CREATE INDEX "availability_weekly_hours_wid_hostId_idx" ON "availability_weekly_hours"("wid", "hostId");

-- AddForeignKey
ALTER TABLE "availability_weekly_hours" ADD CONSTRAINT "availability_weekly_hours_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
