/*
  Warnings:

  - The values [IN_TRANSIT,RECEIVED] on the enum `ItemStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- Step 1: Update all existing records with RECEIVED or IN_TRANSIT to IN_WAREHOUSE (which already exists)
UPDATE "Item" SET "status" = 'IN_WAREHOUSE' WHERE "status" = 'RECEIVED' OR "status" = 'IN_TRANSIT';

-- Step 2: Now we can safely create new enum with STOPPED and migrate
BEGIN;
CREATE TYPE "ItemStatus_new" AS ENUM ('STOPPED', 'IN_WAREHOUSE', 'RELEASED');
ALTER TABLE "Item" ALTER COLUMN "status" TYPE "ItemStatus_new" USING ("status"::text::"ItemStatus_new");
ALTER TYPE "ItemStatus" RENAME TO "ItemStatus_old";
ALTER TYPE "ItemStatus_new" RENAME TO "ItemStatus";
DROP TYPE "public"."ItemStatus_old";
COMMIT;
