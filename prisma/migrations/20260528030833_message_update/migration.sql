-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "filename" TEXT,
ADD COLUMN     "mediaUrl" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'SENT';
