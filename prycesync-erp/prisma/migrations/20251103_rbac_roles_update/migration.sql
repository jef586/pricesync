-- Actualización del enum UserRole a RBAC nuevos con conversión segura

-- 1) Crear enum nuevo
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole_new') THEN
    CREATE TYPE "UserRole_new" AS ENUM ('SUPERADMIN', 'ADMIN', 'SUPERVISOR', 'SELLER', 'TECHNICIAN');
  END IF;
END $$;

-- 2) Convertir users.role al enum nuevo (mapeo via texto)
ALTER TABLE "users"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE ("role"::text)
      -- legados -> nuevos
      WHEN 'admin'   THEN 'ADMIN'
      WHEN 'manager' THEN 'SUPERVISOR'
      WHEN 'user'    THEN 'SELLER'
      WHEN 'viewer'  THEN 'TECHNICIAN'
      -- ya nuevos -> conservar
      WHEN 'SUPERADMIN' THEN 'SUPERADMIN'
      WHEN 'ADMIN'      THEN 'ADMIN'
      WHEN 'SUPERVISOR' THEN 'SUPERVISOR'
      WHEN 'SELLER'     THEN 'SELLER'
      WHEN 'TECHNICIAN' THEN 'TECHNICIAN'
      -- fallback seguro
      ELSE 'SELLER'
    END
  )::"UserRole_new";

-- 3) Fijar default nuevo
ALTER TABLE "users"
  ALTER COLUMN "role" SET DEFAULT 'SELLER';

-- 4) Convertir role_permissions.role al enum nuevo (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'role_permissions' AND column_name = 'role'
  ) THEN
    ALTER TABLE "role_permissions"
      ALTER COLUMN "role" TYPE "UserRole_new"
      USING (
        CASE ("role"::text)
          WHEN 'admin'   THEN 'ADMIN'
          WHEN 'manager' THEN 'SUPERVISOR'
          WHEN 'user'    THEN 'SELLER'
          WHEN 'viewer'  THEN 'TECHNICIAN'
          WHEN 'SUPERADMIN' THEN 'SUPERADMIN'
          WHEN 'ADMIN'      THEN 'ADMIN'
          WHEN 'SUPERVISOR' THEN 'SUPERVISOR'
          WHEN 'SELLER'     THEN 'SELLER'
          WHEN 'TECHNICIAN' THEN 'TECHNICIAN'
          ELSE 'SELLER'
        END
      )::"UserRole_new";
  END IF;
END $$;

-- 5) Eliminar enum viejo y renombrar nuevo
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'UserRole') THEN
    DROP TYPE "UserRole";
  END IF;
END $$;

ALTER TYPE "UserRole_new" RENAME TO "UserRole";