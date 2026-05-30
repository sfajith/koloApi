-- DropIndex
DROP INDEX "Customer_businessId_phone_key";

-- AlterTable
ALTER TABLE "Customer" ALTER COLUMN "phone" DROP NOT NULL;

-- CreateTable
CREATE TABLE "CustomerIdentity" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "provider" "Channel" NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerIdentity_provider_externalUserId_key" ON "CustomerIdentity"("provider", "externalUserId");

-- AddForeignKey
ALTER TABLE "CustomerIdentity" ADD CONSTRAINT "CustomerIdentity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
