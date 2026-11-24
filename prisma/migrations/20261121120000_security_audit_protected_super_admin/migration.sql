
BEGIN;

-- =========================================================
-- 1. Add Protected Super Admin column
-- =========================================================

ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "is_protected_super_admin"
BOOLEAN NOT NULL DEFAULT false;


-- =========================================================
-- 2. Preserve one existing active Super Admin
-- =========================================================

UPDATE "user" AS u
SET "is_protected_super_admin" = true
WHERE u.id = (
    SELECT ur.user_id
    FROM user_roles AS ur
    INNER JOIN roles AS r
        ON r.id = ur.role_id
    INNER JOIN "user" AS candidate
        ON candidate.id = ur.user_id
    WHERE r.is_super_admin = true
      AND candidate."isActive" = true
    ORDER BY candidate."createdAt" ASC, candidate.id ASC
    LIMIT 1
);


-- =========================================================
-- 3. Create Admin Audit Logs table
-- =========================================================

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
    "id" UUID NOT NULL,

    "actor_user_id" TEXT,
    "actor_name" VARCHAR(200),
    "actor_email" VARCHAR(320),
    "actor_roles" JSONB,
    "actor_is_super_admin" BOOLEAN,

    "action" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL DEFAULT 'LOW',
    "description" TEXT NOT NULL,

    "target_type" VARCHAR(50) NOT NULL,
    "target_id" TEXT,
    "target_name" VARCHAR(200),
    "target_email" VARCHAR(320),

    "role_id" UUID,
    "role_name" VARCHAR(100),

    "permission_id" UUID,
    "permission_key" VARCHAR(160),

    "before_state" JSONB,
    "after_state" JSONB,
    "changed_fields" JSONB,

    "request_ip" VARCHAR(100),
    "user_agent" TEXT,
    "request_id" VARCHAR(200),

    "success" BOOLEAN NOT NULL DEFAULT true,
    "failure_code" VARCHAR(100),

    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey"
        PRIMARY KEY ("id")
);


-- =========================================================
-- 4. Create Audit Log indexes
-- =========================================================

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_created_at_idx"
ON "admin_audit_logs" ("created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_actor_user_id_created_at_idx"
ON "admin_audit_logs" ("actor_user_id", "created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_target_type_target_id_created_at_idx"
ON "admin_audit_logs" ("target_type", "target_id", "created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_category_created_at_idx"
ON "admin_audit_logs" ("category", "created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_action_created_at_idx"
ON "admin_audit_logs" ("action", "created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_risk_level_created_at_idx"
ON "admin_audit_logs" ("risk_level", "created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_role_id_created_at_idx"
ON "admin_audit_logs" ("role_id", "created_at");

CREATE INDEX IF NOT EXISTS
    "admin_audit_logs_permission_key_created_at_idx"
ON "admin_audit_logs" ("permission_key", "created_at");


-- =========================================================
-- 5. Create append-only Audit Log trigger function
-- =========================================================

CREATE OR REPLACE FUNCTION public.prevent_admin_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    RAISE EXCEPTION 'admin_audit_logs is append-only';
END;
$function$;


-- =========================================================
-- 6. Prevent UPDATE and DELETE operations
-- =========================================================

DROP TRIGGER IF EXISTS
    "admin_audit_logs_append_only"
ON "admin_audit_logs";

CREATE TRIGGER "admin_audit_logs_append_only"
BEFORE UPDATE OR DELETE
ON "admin_audit_logs"
FOR EACH ROW
EXECUTE FUNCTION public.prevent_admin_audit_log_mutation();


-- =========================================================
-- 7. Prevent TRUNCATE operations
-- =========================================================

DROP TRIGGER IF EXISTS
    "admin_audit_logs_no_truncate"
ON "admin_audit_logs";

CREATE TRIGGER "admin_audit_logs_no_truncate"
BEFORE TRUNCATE
ON "admin_audit_logs"
FOR EACH STATEMENT
EXECUTE FUNCTION public.prevent_admin_audit_log_mutation();


COMMIT;
