/*
  Warnings:

  - You are about to drop the column `utxoId` on the `Inscription` table. All the data in the column will be lost.
  - You are about to drop the `Utxo` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `outputId` to the `Inscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `scriptPubKey` to the `Output` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Inscription" DROP CONSTRAINT "Inscription_utxoId_fkey";

-- AlterTable
ALTER TABLE "Inscription" DROP COLUMN "utxoId",
ADD COLUMN     "outputId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Output" ADD COLUMN     "scriptPubKey" JSONB NOT NULL;

-- DropTable
DROP TABLE "Utxo";

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_outputId_fkey" FOREIGN KEY ("outputId") REFERENCES "Output"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
