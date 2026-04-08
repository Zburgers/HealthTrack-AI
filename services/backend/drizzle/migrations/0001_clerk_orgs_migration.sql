-- Phase 6: Migrate from custom organizations to Clerk Organizations

-- 1. Drop FK constraint on users.organization_id
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_organization_id_organizations_id_fk";

-- 2. Drop users.organization_id column
ALTER TABLE "users" DROP COLUMN IF EXISTS "organization_id";

-- 3. Drop the orgRoleIdx index (no longer needed)
DROP INDEX IF EXISTS "users_org_role_idx";

-- 4. Drop FK constraint on patients.organization_id
ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_organization_id_organizations_id_fk";

-- 5. Change patients.organization_id from UUID to VARCHAR(255)
ALTER TABLE "patients" ALTER COLUMN "organization_id" TYPE varchar(255) USING "organization_id"::varchar;

-- 6. Drop the organizations table
DROP TABLE IF EXISTS "organizations" CASCADE;

-- 7. Drop the _role_enum table (was unused)
DROP TABLE IF EXISTS "_role_enum" CASCADE;
