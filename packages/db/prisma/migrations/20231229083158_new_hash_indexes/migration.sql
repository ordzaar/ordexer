-- DropIndex
DROP INDEX "Inscription_outpoint_idx";

-- AlterTable
ALTER TABLE "Inscription" ALTER COLUMN "mimeSubtype" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Output" ALTER COLUMN "spent" SET DEFAULT false;

-- CreateIndex
CREATE INDEX "Inscription_inscriptionId_idx" ON "Inscription" USING HASH ("inscriptionId");

-- CreateIndex
CREATE INDEX "Inscription_outpoint_idx" ON "Inscription" USING HASH ("outpoint");

-- CreateIndex
CREATE INDEX "Output_voutTxid_idx" ON "Output" USING HASH ("voutTxid");

-- CreateIndex
CREATE INDEX "Output_vinBlockHeight_idx" ON "Output"("vinBlockHeight");

-- CreateIndex
CREATE INDEX "Output_vinTxid_idx" ON "Output" USING HASH ("vinTxid");

-- CreateIndex
CREATE INDEX "Output_addresses_idx" ON "Output" USING GIN ("addresses" array_ops);

-- CreateIndex
CREATE INDEX "Output_spent_idx" ON "Output"("spent");
