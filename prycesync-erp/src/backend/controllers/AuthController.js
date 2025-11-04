import AuthService from '../services/AuthService.js';
import prisma from '../config/database.js';

class AuthController {
  // POST /auth/register
  async register(req, res) {
    try {
      const { email, password, name, companyId, role } = req.body;

      // Validaciones básicas
      if (!email || !password || !name || !companyId) {
        return res.status(400).json({
          error: 'Campos requeridos: email, password, name, companyId',
          code: 'MISSING_REQUIRED_FIELDS'
        });
      }

      if (password.length < 8) {
        return res.status(400).json({
          error: 'La contraseña debe tener al menos 8 caracteres',
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          error: 'Formato de email inválido',
          code: 'INVALID_EMAIL_FORMAT'
        });
      }

      const result = await AuthService.register({
        email: email.toLowerCase().trim(),
        password,
        name: name.trim(),
        companyId,
        role
      });

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(400).json({
        error: error.message,
        code: 'REGISTRATION_FAILED'
      });
    }
  }

  // POST /auth/login
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos',
          code: 'MISSING_CREDENTIALS'
        });
      }

      const ipAddress = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const result = await AuthService.login({
        email: email.toLowerCase().trim(),
        password,
        ipAddress,
        userAgent
      });

      res.json({
        message: 'Login exitoso',
        data: result
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(401).json({
        error: error.message,
        code: 'LOGIN_FAILED'
      });
    }
  }

  // POST /auth/logout
  async logout(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token requerido',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      await AuthService.logout(refreshToken);

      res.json({
        message: 'Logout exitoso'
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(400).json({
        error: error.message,
        code: 'LOGOUT_FAILED'
      });
    }
  }

  // POST /auth/refresh
  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token requerido',
          code: 'MISSING_REFRESH_TOKEN'
        });
      }

      const tokens = await AuthService.refreshToken(refreshToken);

      res.json({
        message: 'Tokens renovados exitosamente',
        data: { tokens }
      });
    } catch (error) {
      console.error('Error renovando token:', error);
      res.status(401).json({
        error: error.message,
        code: 'REFRESH_FAILED'
      });
    }
  }

  // GET /auth/me
  async getProfile(req, res) {
    try {
      // El usuario ya está disponible en req.user gracias al middleware authenticate
      res.json({
        message: 'Perfil obtenido exitosamente',
        data: { user: req.user }
      });
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  // PUT /auth/profile
  async updateProfile(req, res) {
    try {
      const { name, avatarUrl, preferences, timezone } = req.body;
      const userId = req.user.id;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name: name.trim() }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          ...(preferences && { preferences }),
          ...(timezone && { timezone })
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          status: true,
          preferences: true,
          timezone: true,
          company: {
            select: {
              id: true,
              name: true,
              country: true
            }
          },
          updatedAt: true
        }
      });

      res.json({
        message: 'Perfil actualizado exitosamente',
        data: { user: updatedUser }
      });
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      res.status(500).json({
        error: 'Error actualizando perfil',
        code: 'UPDATE_PROFILE_FAILED'
      });
    }
  }

  // POST /auth/change-password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Contraseña actual y nueva son requeridas',
          code: 'MISSING_PASSWORDS'
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: 'La nueva contraseña debe tener al menos 8 caracteres',
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      // Obtener usuario con password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
      });

      // Verificar contraseña actual
      const isValidPassword = await AuthService.verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        return res.status(400).json({
          error: 'Contraseña actual incorrecta',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash de la nueva contraseña
      const newPasswordHash = await AuthService.hashPassword(newPassword);

      // Actualizar contraseña
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      res.json({
        message: 'Contraseña cambiada exitosamente'
      });
    } catch (error) {
      console.error('Error cambiando contraseña:', error);
      res.status(500).json({
        error: 'Error cambiando contraseña',
        code: 'CHANGE_PASSWORD_FAILED'
      });
    }
  }

  // POST /auth/set-password (público)
  async setPassword(req, res) {
    try {
      const { token, password } = req.body
      if (!token || !password) {
        return res.status(400).json({ error: 'Token y contraseña son requeridos', code: 'MISSING_FIELDS' })
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres', code: 'PASSWORD_TOO_SHORT' })
      }

      const tokenHash = (await import('crypto')).default.createHash('sha256').update(token).digest('hex')

      const reset = await prisma.passwordReset.findUnique({
        where: { tokenHash },
        include: { user: { select: { id: true, companyId: true } } }
      })

      if (!reset) {
        return res.status(400).json({ error: 'Token inválido o no encontrado', code: 'INVALID_TOKEN' })
      }

      if (reset.usedAt) {
        return res.status(410).json({ error: 'El token ya fue usado', code: 'TOKEN_USED' })
      }

      if (reset.expiresAt <= new Date()) {
        return res.status(410).json({ error: 'El token expiró', code: 'TOKEN_EXPIRED' })
      }

      const newHash = await AuthService.hashPassword(password)
      await prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: newHash } })

      // Marcar este token como usado y cerrar el resto activo del usuario
      await prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } })
      await prisma.passwordReset.updateMany({ where: { userId: reset.userId, usedAt: null }, data: { usedAt: new Date() } })

      // Revocar sesiones activas
      await prisma.userSession.deleteMany({ where: { userId: reset.userId } })

      // Auditoría
      try {
        const fs = (await import('fs')).default
        const path = (await import('path')).default
        const line = JSON.stringify({ type: 'user_change', actorId: reset.userId, targetId: reset.userId, companyId: reset.user.companyId, changes: { action: 'PASSWORD_SET' }, at: new Date().toISOString() }) + '\n'
        const logfile = path.join(process.cwd(), 'core_reports', 'audit_users.log')
        fs.mkdirSync(path.dirname(logfile), { recursive: true })
        fs.appendFileSync(logfile, line)
      } catch (e) {
        console.warn('Audit log write failed', e)
      }

      return res.json({ ok: true, message: 'Contraseña actualizada. Inicia sesión nuevamente.' })
    } catch (error) {
      console.error('Error estableciendo contraseña:', error)
      return res.status(500).json({ error: 'Error estableciendo contraseña', code: 'SET_PASSWORD_FAILED' })
    }
  }
}

export default new AuthController();