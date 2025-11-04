import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/database.js';

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    this.REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || '7d';
  }

  normalizeRole(role) {
    const map = {
      admin: 'ADMIN',
      manager: 'SUPERVISOR',
      user: 'SELLER',
      viewer: 'TECHNICIAN'
    };
    if (!role) return 'SELLER';
    return map[role] || role;
  }

  // Hash de password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verificar password
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Generar tokens JWT
  generateTokens(userId) {
    const payload = { userId, type: 'access' };
    
    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.JWT_EXPIRES_IN,
    });

    const refreshPayload = { userId, type: 'refresh' };
    const refreshToken = jwt.sign(refreshPayload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  // Verificar token JWT
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  // Registrar usuario
  async register({ email, password, name, companyId, role = 'SELLER' }) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('El usuario ya existe');
      }

      // Verificar que la empresa existe
      const company = await prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!company) {
        throw new Error('Empresa no encontrada');
      }

      // Hash del password
      const passwordHash = await this.hashPassword(password);

      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          companyId,
          role: this.normalizeRole(role),
          status: 'active'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          company: {
            select: {
              id: true,
              name: true
            }
          },
          createdAt: true
        }
      });

      // Generar tokens
      const tokens = this.generateTokens(user.id);

      // Crear sesión
      await this.createSession(user.id, tokens.refreshToken);

      return {
        user,
        tokens
      };
    } catch (error) {
      throw new Error(`Error en registro: ${error.message}`);
    }
  }

  // Login de usuario
  async login({ email, password, ipAddress, userAgent }) {
    try {
      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          status: true,
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!user) {
        throw new Error('Credenciales inválidas');
      }

      // Verificar estado del usuario
      if (user.status !== 'active') {
        throw new Error('Usuario inactivo');
      }

      // Verificar password
      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new Error('Credenciales inválidas');
      }

      // Generar tokens
      const tokens = this.generateTokens(user.id);

      // Crear sesión
      await this.createSession(user.id, tokens.refreshToken, ipAddress, userAgent);

      // Actualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
        select: { id: true }
      });

      // Remover password hash de la respuesta
      const { passwordHash, ...userWithoutPassword } = user;

      // Obtener rol en texto desde BD para evitar conflicto de enum y normalizar
      const roleRow = await prisma.$queryRaw`SELECT role::text AS role FROM "users" WHERE id = ${user.id} LIMIT 1`;
      const rawRole = Array.isArray(roleRow) ? roleRow[0]?.role : roleRow?.role;
      userWithoutPassword.role = this.normalizeRole(rawRole);

      return {
        user: userWithoutPassword,
        tokens
      };
    } catch (error) {
      throw new Error(`Error en login: ${error.message}`);
    }
  }

  // Crear sesión
  async createSession(userId, refreshToken, ipAddress = null, userAgent = null) {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshHash = crypto.randomBytes(32).toString('hex');
    
    // Calcular fecha de expiración
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    return await prisma.userSession.create({
      data: {
        userId,
        tokenHash,
        refreshHash,
        expiresAt,
        ipAddress,
        userAgent
      }
    });
  }

  // Obtener usuario por ID
  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
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
          createdAt: true,
          lastLogin: true
        }
      });

      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      // Adjuntar rol normalizado leyendo en texto desde BD
      const roleRow = await prisma.$queryRaw`SELECT role::text AS role FROM "users" WHERE id = ${user.id} LIMIT 1`;
      const rawRole = Array.isArray(roleRow) ? roleRow[0]?.role : roleRow?.role;
      return { ...user, role: this.normalizeRole(rawRole) };

    } catch (error) {
      throw new Error(`Error obteniendo usuario: ${error.message}`);
    }
  }

  // Logout
  async logout(refreshToken) {
    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      await prisma.userSession.deleteMany({
        where: { tokenHash }
      });

      return { message: 'Logout exitoso' };
    } catch (error) {
      throw new Error(`Error en logout: ${error.message}`);
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      
      const session = await prisma.userSession.findFirst({
        where: {
          tokenHash,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!session) {
        throw new Error('Sesión inválida o expirada');
      }

      // Generar nuevos tokens
      const tokens = this.generateTokens(session.userId);

      // Actualizar sesión
      const newTokenHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');
      await prisma.userSession.update({
        where: { id: session.id },
        data: { tokenHash: newTokenHash }
      });

      return tokens;
    } catch (error) {
      throw new Error(`Error renovando token: ${error.message}`);
    }
  }
}

export default new AuthService();