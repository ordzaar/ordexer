-- CreateTable
CREATE TABLE "Output" (
    "id" TEXT NOT NULL,
    "addresses" TEXT[],
    "value" INTEGER NOT NULL,
    "voutBlockHash" TEXT NOT NULL,
    "voutBlockHeight" INTEGER NOT NULL,
    "voutTxid" TEXT NOT NULL,
    "voutTxIndex" INTEGER NOT NULL,
    "vinBlockHash" TEXT,
    "vinBlockHeight" INTEGER,
    "vinTxid" TEXT,
    "vinTxIndex" INTEGER,
    "spent" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Output_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Utxo" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "sats" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "satRanges" INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    CONSTRAINT "Utxo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" TEXT NOT NULL,
    "utxoId" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "owner" TEXT,
    "sat" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "mimeSubtype" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "mediaCharset" TEXT NOT NULL,
    "mediaSize" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL,
    "genesis" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "outpoint" TEXT NOT NULL,
    "ethereum" TEXT NOT NULL,
    "verified" BOOLEAN,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaContent" (
    "id" TEXT NOT NULL,
    "inscriptionId" TEXT NOT NULL,
    "content" BYTEA NOT NULL,

    CONSTRAINT "MediaContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Output_voutBlockHeight_idx" ON "Output"("voutBlockHeight");

-- CreateIndex
CREATE UNIQUE INDEX "Output_voutTxid_voutTxIndex_key" ON "Output"("voutTxid", "voutTxIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Output_vinTxid_vinTxIndex_key" ON "Output"("vinTxid", "vinTxIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Utxo_location_key" ON "Utxo"("location");

-- CreateIndex
CREATE UNIQUE INDEX "Utxo_txid_index_key" ON "Utxo"("txid", "index");

-- CreateIndex
CREATE INDEX "Inscription_height_idx" ON "Inscription"("height");

-- CreateIndex
CREATE INDEX "Inscription_number_idx" ON "Inscription"("number");

-- CreateIndex
CREATE INDEX "Inscription_outpoint_idx" ON "Inscription"("outpoint");

-- CreateIndex
CREATE INDEX "Inscription_sat_idx" ON "Inscription"("sat");

-- CreateIndex
CREATE INDEX "Inscription_mimeType_idx" ON "Inscription"("mimeType");

-- CreateIndex
CREATE INDEX "Inscription_mimeSubtype_idx" ON "Inscription"("mimeSubtype");

-- CreateIndex
CREATE INDEX "Inscription_mediaType_idx" ON "Inscription"("mediaType");

-- CreateIndex
CREATE UNIQUE INDEX "MediaContent_inscriptionId_key" ON "MediaContent"("inscriptionId");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_utxoId_fkey" FOREIGN KEY ("utxoId") REFERENCES "Utxo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaContent" ADD CONSTRAINT "MediaContent_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
