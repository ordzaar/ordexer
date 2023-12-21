/*
  Warnings:

  - You are about to drop the column `inscriptionId` on the `MediaContent` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[mediaContentId]` on the table `Inscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `mediaContentId` to the `Inscription` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "MediaContent" DROP CONSTRAINT "MediaContent_inscriptionId_fkey";

-- DropIndex
DROP INDEX "MediaContent_inscriptionId_key";

-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN     "mediaContentId" TEXT NOT NULL,
ALTER COLUMN "ethereum" DROP NOT NULL;

-- AlterTable
ALTER TABLE "MediaContent" DROP COLUMN "inscriptionId";

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_mediaContentId_key" ON "Inscription"("mediaContentId");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_mediaContentId_fkey" FOREIGN KEY ("mediaContentId") REFERENCES "MediaContent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
