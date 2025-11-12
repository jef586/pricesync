-- Script SQL para crear permisos de Rubros
-- Este script debe ejecutarse directamente en la base de datos PostgreSQL

-- Insertar permisos de inventario:rubros si no existen
INSERT INTO permissions (name, description, module, created_at, updated_at)
VALUES 
  ('inventory:rubros:create', 'Crear rubros', 'core', NOW(), NOW()),
  ('inventory:rubros:read', 'Ver rubros', 'core', NOW(), NOW()),
  ('inventory:rubros:update', 'Editar rubros', 'core', NOW(), NOW()),
  ('inventory:rubros:delete', 'Eliminar rubros', 'core', NOW(), NOW())
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  module = EXCLUDED.module,
  updated_at = NOW();

-- Asignar permisos a roles
-- SUPERADMIN: todos los permisos
INSERT INTO role_permissions (role, permission_id, created_at)
SELECT 'SUPERADMIN', id, NOW()
FROM permissions
WHERE name LIKE 'inventory:rubros:%'
ON CONFLICT (role, permission_id) DO NOTHING;

-- ADMIN: todos los permisos
INSERT INTO role_permissions (role, permission_id, created_at)
SELECT 'ADMIN', id, NOW()
FROM permissions
WHERE name LIKE 'inventory:rubros:%'
ON CONFLICT (role, permission_id) DO NOTHING;

-- SUPERVISOR: create, read, update (sin delete)
INSERT INTO role_permissions (role, permission_id, created_at)
SELECT 'SUPERVISOR', id, NOW()
FROM permissions
WHERE name IN ('inventory:rubros:create', 'inventory:rubros:read', 'inventory:rubros:update')
ON CONFLICT (role, permission_id) DO NOTHING;

-- SELLER: solo read
INSERT INTO role_permissions (role, permission_id, created_at)
SELECT 'SELLER', id, NOW()
FROM permissions
WHERE name = 'inventory:rubros:read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- TECHNICIAN: solo read
INSERT INTO role_permissions (role, permission_id, created_at)
SELECT 'TECHNICIAN', id, NOW()
FROM permissions
WHERE name = 'inventory:rubros:read'
ON CONFLICT (role, permission_id) DO NOTHING;

-- Verificar la asignación de permisos
SELECT 
  r.role,
  p.name as permission,
  p.description
FROM role_permissions rp
JOIN permissions p ON p.id = rp.permission_id
JOIN (VALUES ('SUPERADMIN'), ('ADMIN'), ('SUPERVISOR'), ('SELLER'), ('TECHNICIAN')) r(role) ON true
WHERE p.name LIKE 'inventory:rubros:%'
ORDER BY r.role, p.name;