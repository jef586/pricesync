import express from 'express';
import AuthController from '../controllers/AuthController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { scopeByCompanyId } from '../middleware/scopeByCompanyId.js';
import prisma from '../config/database.js';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/logout', AuthController.logout); // Logout debe ser público para usar solo refreshToken
router.post('/set-password', AuthController.setPassword); // Público: cambiar contraseña mediante token de reset

// Rutas protegidas (requieren autenticación)
router.use(authenticate); // Aplicar middleware de autenticación a todas las rutas siguientes
router.use(scopeByCompanyId);

router.get('/me', AuthController.getProfile);
router.put('/me', AuthController.updateProfile); // Corregir la ruta para actualizar perfil
router.post('/change-password', AuthController.changePassword);

// Rutas administrativas (solo admin)
router.get('/users', authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      companyId: req.companyId || req.user.company.id,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(role && { role }),
      ...(status && { status })
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          lastLogin: true,
          createdAt: true
        },
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      message: 'Usuarios obtenidos exitosamente',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error obteniendo usuarios',
      code: 'GET_USERS_FAILED'
    });
  }
});

// Actualizar estado de usuario (solo admin)
router.patch('/users/:userId/status', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        error: 'Estado inválido. Debe ser: active, inactive, suspended',
        code: 'INVALID_STATUS'
      });
    }

    const user = await prisma.user.update({
      where: { 
        id: userId,
        companyId: req.user.company.id // Solo usuarios de la misma empresa
      },
      data: { status },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Estado de usuario actualizado exitosamente',
      data: { user }
    });
  } catch (error) {
    console.error('Error actualizando estado de usuario:', error);
    res.status(500).json({
      error: 'Error actualizando estado de usuario',
      code: 'UPDATE_USER_STATUS_FAILED'
    });
  }
});

export default router;