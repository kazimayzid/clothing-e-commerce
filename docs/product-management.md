# Product catalog setup

## Cloudinary environment

Add these server-only variables to the development environment and the production secret manager before uploading product images:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Keep `CLOUDINARY_API_SECRET` out of every `NEXT_PUBLIC_*` variable. Image uploads are proxied through the authenticated server route, which accepts JPEG, PNG, WebP, or AVIF files up to 5 MB, checks the file signature, then sends a signed request to Cloudinary. Cancelled staged uploads are removed when the editor closes; failed persistence also attempts provider cleanup.

## Database migration

The migration adds the empty database-backed catalog. It intentionally does not import the existing sample entries in `Data/mockProducts.ts`.

Review the generated migration and take a database backup before deploying it. Apply it through the normal environment deployment process with:

```sh
pnpm prisma migrate deploy
pnpm prisma generate
```

Do not use `migrate reset` or `db push --force-reset`. No migration has been applied by this implementation.

After migration, create a product in **Admin → Products**. Draft products stay out of the storefront. Publishing requires at least one image. The public product APIs read only `PUBLISHED` database products; the old mock module is no longer referenced by those APIs or storefront services.

The current Prisma schema has no Order or OrderItem models. Product mutations therefore do not rewrite historical database order rows; a historical order snapshot system still needs to be designed before adding product-to-order relations.

## Variant-specific product images

The additive migration `20261126100000_variant_specific_product_images` adds nullable `variant_id` to `product_images`. Existing images keep `variant_id = NULL` and remain common product gallery images. The existing Cloudinary upload route is reused; the authenticated product create/update routes validate ownership before attaching a staged image to a product variant.

Review this migration and apply it after the original product catalog migration through the normal deployment process. It has not been applied. Product detail selections then load that variant's ordered gallery, with the common gallery as fallback. Cart additions and quantity increases are revalidated against the published product, active variant, current database price, and stock through `/api/v1/cart/validate`.

The cart remains browser-persisted and this route checks stock at add/update time; it does not reserve inventory. The project still has no checkout/order persistence, so checkout must revalidate price and inventory before accepting payment.
