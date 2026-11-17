CREATE TYPE "AdminInvitationEmailStatus" AS ENUM (
  'NOT_ATTEMPTED',
  'SENDING',
  'ACCEPTED_BY_PROVIDER',
  'FAILED',
  'UNKNOWN'
);

ALTER TABLE "admin_invitations"
  ADD COLUMN "email_status" "AdminInvitationEmailStatus" NOT NULL DEFAULT 'NOT_ATTEMPTED',
  ADD COLUMN "provider_email_id" VARCHAR(120),
  ADD COLUMN "email_attempted_at" TIMESTAMP(3),
  ADD COLUMN "last_email_error" TEXT;
