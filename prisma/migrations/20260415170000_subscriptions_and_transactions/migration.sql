-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('CREATED', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "hostId" UUID NOT NULL,
    "wid" INTEGER NOT NULL,
    "subscriptionId" UUID,
    "status" "TransactionStatus" NOT NULL DEFAULT 'CREATED',
    "provider" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "providerOrderId" TEXT,
    "providerPaymentId" TEXT,
    "providerSignature" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "subscriptions_hostId_idx" ON "subscriptions"("hostId");

-- CreateIndex
CREATE INDEX "subscriptions_wid_hostId_idx" ON "subscriptions"("wid", "hostId");

-- CreateIndex
CREATE INDEX "subscriptions_hostId_status_idx" ON "subscriptions"("hostId", "status");

-- CreateIndex
CREATE INDEX "transactions_hostId_idx" ON "transactions"("hostId");

-- CreateIndex
CREATE INDEX "transactions_wid_hostId_idx" ON "transactions"("wid", "hostId");

-- CreateIndex
CREATE INDEX "transactions_hostId_status_idx" ON "transactions"("hostId", "status");

-- CreateIndex
CREATE INDEX "transactions_providerOrderId_idx" ON "transactions"("providerOrderId");

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "user_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
