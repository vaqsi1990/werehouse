-- Rename columns and add new field
ALTER TABLE "Item" RENAME COLUMN "productNumber" TO "mtrikhKodi";
ALTER TABLE "Item" RENAME COLUMN "phone" TO "telefoni";
ALTER TABLE "Item" RENAME COLUMN "weight" TO "tsona";
ALTER TABLE "Item" RENAME COLUMN "city" TO "kalaki";

-- Add new field for gamomcemeli
ALTER TABLE "Item" ADD COLUMN "gamomcemeli" TEXT NOT NULL DEFAULT '';

-- Combine Name and fullName into mimgebi, then drop the old columns
ALTER TABLE "Item" ADD COLUMN "mimgebi" TEXT NOT NULL DEFAULT '';
UPDATE "Item" SET "mimgebi" = COALESCE("Name", '') || ' ' || COALESCE("fullName", '');
ALTER TABLE "Item" ALTER COLUMN "mimgebi" DROP DEFAULT;

-- Drop old columns
ALTER TABLE "Item" DROP COLUMN "Name";
ALTER TABLE "Item" DROP COLUMN "fullName";
