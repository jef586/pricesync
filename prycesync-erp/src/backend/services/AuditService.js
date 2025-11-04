import { prisma } from '../config/database.js'

/**
 * AuditService: persist immutable audit records to AuditLog.
 * Provides simple helpers for common actions.
 */
class AuditService {
  /**
   * Generic audit logger. Accepts any payloadDiff JSON.
   */
  static async log({ actorId, actorName, targetId, targetName, actionType, payloadDiff, companyId, ip, userAgent }) {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: actorId || null,
          actorName: actorName || null,
          targetId: targetId || null,
          targetName: targetName || null,
          actionType,
          payloadDiff: payloadDiff ?? {},
          companyId: companyId || null,
          ip: ip || null,
          userAgent: userAgent || null,
        }
      })
    } catch (err) {
      // Non-fatal
      console.warn('AuditService.log failed:', err.message)
    }
  }

  static async logUserChange({ actor, target, companyId, changes, ip, userAgent }) {
    const payload = typeof changes === 'object' ? changes : { changes }
    await this.log({
      actorId: actor?.id,
      actorName: actor?.name,
      targetId: target?.id,
      targetName: target?.name || target?.email,
      actionType: payload.action || 'USER_CHANGE',
      payloadDiff: payload,
      companyId,
      ip,
      userAgent,
    })
  }

  static async logRolePermissionsUpdate({ actor, role, added = [], removed = [], companyId, ip, userAgent }) {
    await this.log({
      actorId: actor?.id,
      actorName: actor?.name,
      targetId: role,
      targetName: role,
      actionType: 'ROLE_PERMISSIONS_UPDATE',
      payloadDiff: { role, added, removed },
      companyId,
      ip,
      userAgent,
    })
  }
}

export default AuditService