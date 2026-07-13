/*
  Warnings:

  - The `updatedAt` column was backfilled in the previous migration with a `DEFAULT CURRENT_TIMESTAMP`
    so existing rows could be migrated. Prisma's `@updatedAt` does not expect a DB-level default, which
    causes schema drift on subsequent `migrate dev` runs. This migration drops the default to match the
    schema exactly.

*/
-- AlterTable
ALTER TABLE "ChatSession" ALTER COLUMN "updatedAt" DROP DEFAULT;
