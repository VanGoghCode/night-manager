-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('admin', 'product_manager', 'engineer', 'reviewer', 'qa', 'release_manager');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "role" "PlatformRole" NOT NULL DEFAULT 'engineer';
