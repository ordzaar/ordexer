/*
  Warnings:

  - You are about to drop the column `metadata` on the `Inscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Inscription" DROP COLUMN "metadata",
ADD COLUMN     "meta" JSONB;
