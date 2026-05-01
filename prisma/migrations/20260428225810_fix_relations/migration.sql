/*
  Warnings:

  - Added the required column `ownerId` to the `Business` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'OWNER';

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "ownerId" TEXT NOT NULL;
