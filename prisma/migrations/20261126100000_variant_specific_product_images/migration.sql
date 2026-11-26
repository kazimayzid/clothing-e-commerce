ALTER TABLE "product_images" ADD COLUMN "variant_id" UUID;

CREATE INDEX "product_images_variant_id_deleted_at_sort_order_idx"
ON "product_images"("variant_id", "deleted_at", "sort_order");

ALTER TABLE "product_images"
ADD CONSTRAINT "product_images_variant_id_fkey"
FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "product_images"
ADD CONSTRAINT "product_images_variant_product_match_check"
CHECK ("variant_id" IS NULL OR "product_id" IS NOT NULL);
