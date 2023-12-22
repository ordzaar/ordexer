/*
  Warnings:

  - A unique constraint covering the columns `[inscriptionId]` on the table `Inscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inscriptionId` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sequence` to the `Inscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN     "inscriptionId" TEXT NOT NULL,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "ometa" JSONB,
ADD COLUMN     "sequence" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_inscriptionId_key" ON "Inscription"("inscriptionId");
