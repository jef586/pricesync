// Seed inicial de roles, permisos, empresa y usuarios base
// Idempotente y ejecutable vía: npx prisma db seed o npm run seed
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import path from 'path'
import { fileURLToPath } from 'url'

// Importar catálogo y matriz desde middleware para mantener consistencia
// Ruta relativa desde prisma/ hacia src/backend
import { PERMISSIONS as PERM_CATALOG, ROLE_PERMISSIONS as ROLE_MATRIX } from '../src/backend/middleware/permissions.js'

const prisma = new PrismaClient()

function env(name, def) {
  const v = process.env[name]
  return (v !== undefined && v !== null && String(v).length > 0) ? v : def
}

async function ensurePermissions() {
  // Crea catálogo de permisos en BD si no existen
  const keys = Object.keys(PERM_CATALOG)
  for (const code of keys) {
    const meta = PERM_CATALOG[code]
    await prisma.permission.upsert({
      where: { name: code },
      update: { description: meta?.label ?? null, module: 'core' },
      create: { name: code, description: meta?.label ?? null, module: 'core' }
    })
  }
}

async function ensureRoleMatrix() {
  // Persistir matriz en role_permissions (permite que el editor de matriz escriba diffs)
  const keys = Object.keys(PERM_CATALOG)
  const rows = await prisma.permission.findMany({
    where: { name: { in: keys } },
    select: { id: true, name: true }
  })
  const idByName = Object.fromEntries(rows.map(r => [r.name, r.id]))

  for (const role of Object.keys(ROLE_MATRIX)) {
    const perms = ROLE_MATRIX[role] || []
    for (const code of perms) {
      const pid = idByName[code]
      if (!pid) continue
      // Upsert sobre índice único compuesto [role, permissionId]
      await prisma.rolePermission.upsert({
        where: { role_permissionId: { role, permissionId: pid } },
        update: {},
        create: { role, permissionId: pid }
      })
    }
  }
}

async function ensureCompanyAndUsers() {
  const DEFAULT_COMPANY_NAME = env('DEFAULT_COMPANY_NAME', 'ACME S.A.')
  const DEFAULT_COMPANY_TAXID = env('DEFAULT_COMPANY_TAXID', '20999999991')
  const DEFAULT_ADMIN_EMAIL = env('DEFAULT_ADMIN_EMAIL', 'admin@acme.local')
  const DEFAULT_ADMIN_PASS = env('DEFAULT_ADMIN_PASS', 'dev12345')

  // Empresa (Company.taxId es único requerido en schema)
  const company = await prisma.company.upsert({
    where: { taxId: DEFAULT_COMPANY_TAXID },
    update: { name: DEFAULT_COMPANY_NAME },
    create: {
      name: DEFAULT_COMPANY_NAME,
      taxId: DEFAULT_COMPANY_TAXID,
      email: 'admin@acme.local',
      country: 'AR'
    }
  })

  // Asegurar warehouse por defecto para la compañía
  const existingWh = await prisma.warehouse.findFirst({ where: { companyId: company.id } })
  let defaultWhId = existingWh?.id
  if (!defaultWhId) {
    const createdWh = await prisma.warehouse.create({ data: { name: 'Depósito Principal', code: 'MAIN', companyId: company.id } })
    defaultWhId = createdWh.id
  }
  // Guardar en fiscalConfig.inventory.defaultWarehouseId
  const currentCfg = company.fiscalConfig || {}
  const mergedCfg = {
    ...(typeof currentCfg === 'object' ? currentCfg : {}),
    inventory: {
      ...((typeof currentCfg?.inventory === 'object') ? currentCfg.inventory : {}),
      defaultWarehouseId: defaultWhId
    }
  }
  await prisma.company.update({ where: { id: company.id }, data: { fiscalConfig: mergedCfg } })

  // Usuarios base
  const devPass = DEFAULT_ADMIN_PASS
  const hash = await bcrypt.hash(devPass, 10)

  // SUPERADMIN global (asignado a la empresa para company_id consistente)
  await prisma.user.upsert({
    where: { email: 'superadmin@system.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@system.local',
      passwordHash: hash,
      role: 'SUPERADMIN',
      companyId: company.id,
      status: 'active'
    }
  })

  // ADMIN de la empresa demo
  await prisma.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: {},
    create: {
      name: 'Admin ACME',
      email: DEFAULT_ADMIN_EMAIL,
      passwordHash: hash,
      role: 'ADMIN',
      companyId: company.id,
      status: 'active'
    }
  })

  // Usuarios dev adicionales (solo en desarrollo)
  const envNode = String(process.env.NODE_ENV || 'development').toLowerCase()
  if (envNode !== 'production') {
    await prisma.user.upsert({
      where: { email: 'supervisor@acme.local' },
      update: {},
      create: {
        name: 'Supervisor ACME',
        email: 'supervisor@acme.local',
        passwordHash: hash,
        role: 'SUPERVISOR',
        companyId: company.id,
        status: 'active'
      }
    })

    await prisma.user.upsert({
      where: { email: 'seller@acme.local' },
      update: {},
      create: {
        name: 'Seller ACME',
        email: 'seller@acme.local',
        passwordHash: hash,
        role: 'SELLER',
        companyId: company.id,
        status: 'active'
      }
    })
  }
}

async function writeAuditSeed(companyId) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: 'system',
        actorName: 'system',
        targetId: companyId,
        targetName: 'Initial Seed',
        actionType: 'SEED_INIT',
        payloadDiff: {
          message: 'Seed inicial ejecutado',
          roles: ['SUPERADMIN','ADMIN','SUPERVISOR','SELLER','TECHNICIAN'],
          permissions: Object.keys(PERM_CATALOG)
        },
        companyId: companyId,
        ip: null,
        userAgent: 'seed-script'
      }
    })
  } catch (err) {
    console.warn('[seed] Auditoría no registrada:', err?.message)
  }
}

async function main() {
  console.log('🔰 [seed] Iniciando seed inicial...')

  // Crear/asegurar catálogo y matriz siempre (idempotente)
  await ensurePermissions()
  await ensureRoleMatrix()

  // Crear empresa y usuarios solo si DB vacía (idempotente)
  const usersCount = await prisma.user.count()
  const companyCount = await prisma.company.count()
  if (usersCount === 0 && companyCount === 0) {
    await ensureCompanyAndUsers()
  } else {
    console.log('⏭️  [seed] Saltando creación de empresa/usuarios (ya existen).', { usersCount, companyCount })
  }

  // Auditoría
  const company = await prisma.company.findFirst({ select: { id: true } })
  await writeAuditSeed(company?.id || null)

  console.log('✅ [seed] Seed inicial completado.')
}

main()
  .catch((e) => {
    console.error('❌ [seed] Error:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
