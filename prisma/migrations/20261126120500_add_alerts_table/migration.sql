-- CreateTable
CREATE TABLE "AlertPreference" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "identifier" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'email',
    "types" TEXT NOT NULL DEFAULT 'deadline,cutoff,spot',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AlertPreference_identifier_key" ON "AlertPreference"("identifier");

-- CreateIndex
CREATE INDEX "AlertPreference_active_channel_idx" ON "AlertPreference"("active", "channel");

-- AddForeignKey
ALTER TABLE "AlertPreference" ADD CONSTRAINT "AlertPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

