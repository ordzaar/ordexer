/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Indexer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `Indexer` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Indexer" ADD COLUMN     "name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Indexer_name_key" ON "Indexer"("name");
