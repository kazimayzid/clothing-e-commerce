CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "ProductGender" AS ENUM ('MEN', 'WOMEN', 'UNISEX', 'KIDS');

CREATE TABLE "product_categories" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "slug" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "products" (
    "id" VARCHAR(30) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT NOT NULL,
    "details_and_care" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "gender" "ProductGender" NOT NULL DEFAULT 'UNISEX',
    "category_id" UUID NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "multibuy_price" DECIMAL(10,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'GBP',
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "bestseller_rank" INTEGER,
    "created_by_id" TEXT,
    "archived_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "products_price_nonnegative" CHECK ("price" >= 0),
    CONSTRAINT "products_multibuy_price_nonnegative" CHECK ("multibuy_price" IS NULL OR "multibuy_price" >= 0),
    CONSTRAINT "products_bestseller_rank_positive" CHECK ("bestseller_rank" IS NULL OR "bestseller_rank" > 0)
);

CREATE TABLE "product_images" (
    "id" UUID NOT NULL,
    "product_id" VARCHAR(30),
    "uploaded_by_id" TEXT NOT NULL,
    "provider" VARCHAR(20) NOT NULL DEFAULT 'CLOUDINARY',
    "public_id" VARCHAR(255) NOT NULL,
    "secure_url" TEXT NOT NULL,
    "format" VARCHAR(12) NOT NULL,
    "alt_text" VARCHAR(250),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" VARCHAR(30) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "sku" VARCHAR(100),
    "size" VARCHAR(40),
    "color_name" VARCHAR(80),
    "color_hex" VARCHAR(7),
    "price_override" DECIMAL(10,2),
    "stock_quantity" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "product_variants_price_nonnegative" CHECK ("price_override" IS NULL OR "price_override" >= 0),
    CONSTRAINT "product_variants_stock_nonnegative" CHECK ("stock_quantity" >= 0),
    CONSTRAINT "product_variants_color_hex_valid" CHECK ("color_hex" IS NULL OR "color_hex" ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX "product_categories_slug_key" ON "product_categories"("slug");
CREATE INDEX "product_categories_name_idx" ON "product_categories"("name");
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_status_created_at_idx" ON "products"("status", "created_at");
CREATE INDEX "products_category_id_status_idx" ON "products"("category_id", "status");
CREATE INDEX "products_title_idx" ON "products"("title");
CREATE UNIQUE INDEX "product_images_public_id_key" ON "product_images"("public_id");
CREATE INDEX "product_images_product_id_deleted_at_sort_order_idx" ON "product_images"("product_id", "deleted_at", "sort_order");
CREATE INDEX "product_images_uploaded_by_id_product_id_created_at_idx" ON "product_images"("uploaded_by_id", "product_id", "created_at");
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX "product_variants_product_id_is_active_idx" ON "product_variants"("product_id", "is_active");
CREATE INDEX "product_variants_product_id_stock_quantity_idx" ON "product_variants"("product_id", "stock_quantity");

ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "product_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
