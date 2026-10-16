-- CreateEnum
CREATE TYPE "Country" AS ENUM ('FRANCE', 'RUSSIA');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN "country" "Country" NOT NULL DEFAULT 'FRANCE';
