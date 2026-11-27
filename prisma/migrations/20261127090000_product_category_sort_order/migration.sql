ALTER TABLE "product_categories"
  ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;

DROP INDEX "product_categories_parent_id_archived_at_name_idx";

CREATE INDEX "product_categories_parent_id_archived_at_sort_order_name_idx"
  ON "product_categories"("parent_id", "archived_at", "sort_order", "name");
