import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authorize, requirePermission } from '../middleware/permissions.js';

describe('Authorization Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      path: '/api/test'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  describe('authorize() middleware', () => {
    it('should return 401 when user is not authenticated', () => {
      const middleware = authorize('inventory:rubros:read');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No autenticado',
        code: 'NOT_AUTHENTICATED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 when user lacks required permission', () => {
      req.user = {
        id: 'user123',
        role: 'SELLER',
        permissions: []
      };

      const middleware = authorize('inventory:rubros:create');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Permiso denegado',
        code: 'PERMISSION_DENIED',
        missing: ['inventory:rubros:create'],
        audit: {
          userId: 'user123',
          path: '/api/test',
          required: ['inventory:rubros:create'],
          granted: ['sales:create', 'inventory:rubros:read']
        }
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() when user has required permission', () => {
      req.user = {
        id: 'user123',
        role: 'ADMIN',
        permissions: []
      };

      const middleware = authorize('inventory:rubros:create');
      middleware(req, res, next);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });

    it('should handle multiple permissions with requirePermission', () => {
      req.user = {
        id: 'user123',
        role: 'SUPERVISOR',
        permissions: []
      };

      const middleware = requirePermission('inventory:rubros:read', 'inventory:rubros:delete');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permiso denegado',
          code: 'PERMISSION_DENIED',
          missing: expect.arrayContaining(['inventory:rubros:delete'])
        })
      );
    });

    it('should handle role normalization correctly', () => {
      req.user = {
        id: 'user123',
        role: 'admin', // lowercase
        permissions: []
      };

      const middleware = authorize('inventory:rubros:create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled(); // Should work with normalized role
    });

    it('should handle internal errors gracefully', () => {
      req.user = {
        id: 'user123',
        role: 'INVALID_ROLE' // Invalid role that doesn't exist in ROLE_PERMISSIONS
      };

      const middleware = authorize('inventory:rubros:read');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Permiso denegado',
          code: 'PERMISSION_DENIED',
          missing: ['inventory:rubros:read']
        })
      );
    });
  });

  describe('Permission-specific tests for rubros', () => {
    it('should allow ADMIN to create rubros', () => {
      req.user = {
        id: 'user123',
        role: 'ADMIN',
        permissions: []
      };

      const middleware = authorize('inventory:rubros:create');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow SUPERVISOR to read rubros but not delete', () => {
      req.user = {
        id: 'user123',
        role: 'SUPERVISOR',
        permissions: []
      };

      // Should allow read
      const readMiddleware = authorize('inventory:rubros:read');
      readMiddleware(req, res, next);
      expect(next).toHaveBeenCalled();

      // Reset next mock
      next.mockClear();

      // Should not allow delete
      const deleteMiddleware = authorize('inventory:rubros:delete');
      deleteMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow SELLER only to read rubros', () => {
      req.user = {
        id: 'user123',
        role: 'SELLER',
        permissions: []
      };

      const middleware = authorize('inventory:rubros:read');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();

      // Reset and test create (should fail)
      next.mockClear();
      const createMiddleware = authorize('inventory:rubros:create');
      createMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should allow TECHNICIAN only to read rubros', () => {
      req.user = {
        id: 'user123',
        role: 'TECHNICIAN',
        permissions: []
      };

      const middleware = authorize('inventory:rubros:read');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();

      // Reset and test update (should fail)
      next.mockClear();
      const updateMiddleware = authorize('inventory:rubros:update');
      updateMiddleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });
});