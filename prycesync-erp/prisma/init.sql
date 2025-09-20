-- Inicialización de la base de datos PriceSync ERP
-- Este script se ejecuta automáticamente cuando se crea el contenedor de PostgreSQL

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Crear función para generar CUIDs (compatible con Prisma)
-- Nota: Prisma maneja los CUIDs automáticamente, pero dejamos esto por compatibilidad
CREATE OR REPLACE FUNCTION generate_cuid() RETURNS TEXT AS $$
BEGIN
    RETURN 'c' || encode(gen_random_bytes(12), 'base64')::text;
END;
$$ LANGUAGE plpgsql;

-- Configurar timezone por defecto
SET timezone = 'America/Argentina/Buenos_Aires';

-- Mensaje de confirmación
DO $$
BEGIN
    RAISE NOTICE 'Base de datos PriceSync ERP inicializada correctamente';
    RAISE NOTICE 'Timezone configurado: %', current_setting('timezone');
    RAISE NOTICE 'Extensiones habilitadas: uuid-ossp, pgcrypto';
END $$;