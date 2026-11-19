ALTER TABLE "admin_invitations"
  ADD COLUMN "email_provider" VARCHAR(20) NOT NULL DEFAULT 'SMTP',
  ADD COLUMN "provider_response" TEXT,
  ADD COLUMN "invitee_existed_at_invite" BOOLEAN NOT NULL DEFAULT false;

UPDATE "admin_invitations"
SET "email_provider" = 'RESEND',
    "email_status" = 'ACCEPTED_BY_PROVIDER'
WHERE "sent_at" IS NOT NULL
  AND "email_status" = 'NOT_ATTEMPTED';

CREATE TABLE "admin_access_removals" (
  "id" UUID NOT NULL,
  "user_id" TEXT NOT NULL,
  "removed_by_id" TEXT NOT NULL,
  "recipient_email" VARCHAR(320) NOT NULL,
  "recipient_name" VARCHAR(200) NOT NULL,
  "removed_roles" JSONB NOT NULL,
  "email_provider" VARCHAR(20) NOT NULL DEFAULT 'SMTP',
  "email_status" "AdminInvitationEmailStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  "provider_email_id" VARCHAR(120),
  "provider_response" TEXT,
  "email_attempted_at" TIMESTAMP(3),
  "last_email_error" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_access_removals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_access_removals_user_id_created_at_idx"
  ON "admin_access_removals"("user_id", "created_at");
CREATE INDEX "admin_access_removals_removed_by_id_idx"
  ON "admin_access_removals"("removed_by_id");
CREATE INDEX "admin_access_removals_email_status_created_at_idx"
  ON "admin_access_removals"("email_status", "created_at");

ALTER TABLE "admin_access_removals"
  ADD CONSTRAINT "admin_access_removals_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "admin_access_removals_removed_by_id_fkey"
    FOREIGN KEY ("removed_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
