ALTER TABLE "product_categories"
  ADD COLUMN "description" TEXT,
  ADD COLUMN "parent_id" UUID,
  ADD COLUMN "archived_at" TIMESTAMP(3);

CREATE INDEX "product_categories_parent_id_archived_at_name_idx"
  ON "product_categories"("parent_id", "archived_at", "name");

ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_parent_id_fkey"
  FOREIGN KEY ("parent_id") REFERENCES "product_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_categories"
  ADD CONSTRAINT "product_categories_not_own_parent_check"
  CHECK ("parent_id" IS NULL OR "parent_id" <> "id");
