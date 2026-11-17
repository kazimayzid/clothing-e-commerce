CREATE TYPE "RoleScope" AS ENUM ('ADMIN', 'CUSTOMER');
CREATE TYPE "AdminInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED');

ALTER TABLE "roles"
  ADD COLUMN "scope" "RoleScope" NOT NULL DEFAULT 'ADMIN',
  ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;

-- The live database audit confirmed these existing rows: admin (1 account),
-- staff (0 accounts), and user (2 accounts). Preserve all assignments.
UPDATE "roles" SET "scope" = 'CUSTOMER' WHERE "slug" = 'user';
UPDATE "roles" SET "scope" = 'ADMIN', "is_super_admin" = true WHERE "slug" = 'admin';

ALTER TABLE "permissions" ADD COLUMN "description" TEXT;

CREATE TABLE "admin_invitations" (
  "id" UUID NOT NULL,
  "email" VARCHAR(320) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "token_hash" VARCHAR(64) NOT NULL,
  "status" "AdminInvitationStatus" NOT NULL DEFAULT 'PENDING',
  "expires_at" TIMESTAMP(3) NOT NULL,
  "sent_at" TIMESTAMP(3),
  "accepted_at" TIMESTAMP(3),
  "revoked_at" TIMESTAMP(3),
  "invited_by_id" TEXT NOT NULL,
  "accepted_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "admin_invitations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "admin_invitation_roles" (
  "invitation_id" UUID NOT NULL,
  "role_id" UUID NOT NULL,
  CONSTRAINT "admin_invitation_roles_pkey" PRIMARY KEY ("invitation_id", "role_id")
);

CREATE UNIQUE INDEX "admin_invitations_token_hash_key" ON "admin_invitations"("token_hash");
CREATE INDEX "admin_invitations_email_status_idx" ON "admin_invitations"("email", "status");
CREATE INDEX "admin_invitations_status_expires_at_idx" ON "admin_invitations"("status", "expires_at");
CREATE INDEX "admin_invitations_invited_by_id_idx" ON "admin_invitations"("invited_by_id");
CREATE UNIQUE INDEX "admin_invitations_one_pending_per_email" ON "admin_invitations"("email") WHERE "status" = 'PENDING';
CREATE INDEX "admin_invitation_roles_role_id_idx" ON "admin_invitation_roles"("role_id");

ALTER TABLE "admin_invitations"
  ADD CONSTRAINT "admin_invitations_invited_by_id_fkey"
    FOREIGN KEY ("invited_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "admin_invitations_accepted_user_id_fkey"
    FOREIGN KEY ("accepted_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "admin_invitation_roles"
  ADD CONSTRAINT "admin_invitation_roles_invitation_id_fkey"
    FOREIGN KEY ("invitation_id") REFERENCES "admin_invitations"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "admin_invitation_roles_role_id_fkey"
    FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
