-- Remove address column and add sakGadakhda and tarighi
ALTER TABLE "Item" DROP COLUMN IF EXISTS "address";
ALTER TABLE "Item" ADD COLUMN "sakGadakhda" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Item" ADD COLUMN "tarighi" TIMESTAMP(3);
