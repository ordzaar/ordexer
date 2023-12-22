-- DropForeignKey
ALTER TABLE "Inscription" DROP CONSTRAINT "Inscription_outputId_fkey";

-- AlterTable
ALTER TABLE "Inscription" ALTER COLUMN "outputId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_outputId_fkey" FOREIGN KEY ("outputId") REFERENCES "Output"("id") ON DELETE SET NULL ON UPDATE CASCADE;
