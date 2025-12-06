-- CreateTable
CREATE TABLE "bang_diem" (
    "id" SERIAL NOT NULL,
    "sbd" TEXT NOT NULL,
    "toan" DOUBLE PRECISION,
    "ngu_van" DOUBLE PRECISION,
    "ngoai_ngu" DOUBLE PRECISION,
    "vat_li" DOUBLE PRECISION,
    "hoa_hoc" DOUBLE PRECISION,
    "sinh_hoc" DOUBLE PRECISION,
    "lich_su" DOUBLE PRECISION,
    "dia_li" DOUBLE PRECISION,
    "gdcd" DOUBLE PRECISION,
    "ma_ngoai_ngu" TEXT,

    CONSTRAINT "bang_diem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bang_diem_sbd_key" ON "bang_diem"("sbd");
