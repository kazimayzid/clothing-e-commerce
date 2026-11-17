# Admin RBAC and invitations

## Email delivery

Admin invitations and Better Auth verification emails use the Resend HTTP API through `lib/email.ts`. Configure these server environment variables before sending invitations:

```dotenv
RESEND_API_KEY=re_...
EMAIL_FROM=LuneCraft <team@your-verified-domain.example>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

`RESEND_API_KEY` and `EMAIL_FROM` are required for delivery. `EMAIL_FROM` must use a domain verified in the same Resend account as the key. `BETTER_AUTH_URL` and `NEXT_PUBLIC_BASE_URL` must point to the public app origin in each environment; production invitation links must use HTTPS. Do not commit the provider key. Invitation history records send status, provider email ID, last safe error, and provider-accepted timestamp. Provider acceptance does not confirm inbox delivery; no Delivered state is claimed without a delivery event. Public signup continues to work; invited accounts must verify their email before the invitation can be accepted.

## Database rollout

The audited database currently has the existing `admin`, `staff`, and `user` roles; the `admin` role has one assigned user and six permissions, `staff` has one permission, and `user` has two assigned users. Existing role-permission keys are:

- `admin`: `dashboard:access`, `users:read`, `users:assign_role`, `roles:manage`, `products:manage`, `orders:manage`
- `staff`: `dashboard:access`

Only these two migration records were applied at audit time: `20261020145339_init_better_auth` and `20261106095913_add_rbac_roles_permissions`.

The new migration preserves current users and join rows, marks the existing `admin` role as Super Admin, and changes only the `user` role scope to `CUSTOMER`. Other existing roles default to `ADMIN`. It adds invitation tables and a uniqueness constraint for one pending invitation per normalized email. It has not been applied to the database by this implementation.

After reviewing the migration SQL, deploy it with the project's production migration workflow, then run the seed once to populate the centralized permission catalog. The seed uses upserts, keeps legacy permission keys and existing assignments, adds the new catalog keys to the protected Super Admin role, and keeps Staff at dashboard access unless you assign additional roles/permissions.

```sh
pnpm exec prisma migrate deploy
pnpm exec prisma db seed
```

Do not run `prisma migrate reset` on this database.
