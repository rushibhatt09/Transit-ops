-- AlterTable
ALTER TABLE "Driver" ADD COLUMN "userId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Driver_userId_key" ON "Driver"("userId");
