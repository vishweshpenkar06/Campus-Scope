-- AlterTable
ALTER TABLE "College" ADD COLUMN     "instituteCode" TEXT;

-- AlterTable
ALTER TABLE "Cutoff" ADD COLUMN     "branchCode" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "rank" INTEGER,
ADD COLUMN     "seatType" TEXT,
ADD COLUMN     "sourceDocumentId" INTEGER,
ADD COLUMN     "sourcePage" INTEGER,
ADD COLUMN     "stage" TEXT;

-- CreateTable
CREATE TABLE "SourceDocument" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "capRound" INTEGER NOT NULL,
    "seatType" TEXT NOT NULL DEFAULT 'Maharashtra',
    "sha256" TEXT NOT NULL,
    "pageCount" INTEGER,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SourceDocument_url_key" ON "SourceDocument"("url");

-- CreateIndex
CREATE INDEX "SourceDocument_year_capRound_idx" ON "SourceDocument"("year", "capRound");

-- CreateIndex
CREATE UNIQUE INDEX "College_instituteCode_key" ON "College"("instituteCode");

-- CreateIndex
CREATE INDEX "Cutoff_sourceDocumentId_idx" ON "Cutoff"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "Cutoff_collegeId_year_capRound_idx" ON "Cutoff"("collegeId", "year", "capRound");

-- AddForeignKey
ALTER TABLE "Cutoff" ADD CONSTRAINT "Cutoff_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "SourceDocument"("id") ON DELETE SET NULL ON UPDATE CASCADE;
