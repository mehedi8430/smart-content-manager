-- AlterTable
ALTER TABLE "AiOutput" ADD COLUMN     "model" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'completed',
ADD COLUMN     "title" TEXT,
ADD COLUMN     "tokensUsed" INTEGER,
ADD COLUMN     "tone" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW();
