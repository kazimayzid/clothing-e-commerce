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
