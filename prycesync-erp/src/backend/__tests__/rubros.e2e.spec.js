import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, server } from '../server.js';
import prisma from '../../config/database.js';
import jwt from 'jsonwebtoken';

describe('Rubros API E2E Tests', () => {
  let authToken;
  let testCompanyId;
  let testUserId;
  let testRubroId;

  beforeAll(async () => {
    // Create test company
    const company = await prisma.company.create({
      data: {
        name: 'Test Company Rubros',
        taxId: 'TEST-RUBROS-123'
      }
    });
    testCompanyId = company.id;

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test-rubros@example.com',
        passwordHash: 'hashed-password',
        name: 'Test User Rubros',
        role: 'ADMIN',
        companyId: testCompanyId
      }
    });
    testUserId = user.id;

    // Generate auth token
    authToken = jwt.sign(
      { 
        userId: testUserId, 
        companyId: testCompanyId, 
        role: 'ADMIN',
        permissions: ['inventory:rubros:create', 'inventory:rubros:read', 'inventory:rubros:update', 'inventory:rubros:delete']
      },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.category.deleteMany({
      where: { companyId: testCompanyId }
    });
    await prisma.user.deleteMany({
      where: { id: testUserId }
    });
    await prisma.company.deleteMany({
      where: { id: testCompanyId }
    });
    
    await prisma.$disconnect();
    server.close();
  });

  describe('POST /api/rubros', () => {
    it('should create a new rubro successfully', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Rubro',
          marginRate: 15,
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Rubro');
      expect(response.body.data.marginRate).toBe(15);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.level).toBe(0);
      expect(response.body.data.path).toBeDefined();

      testRubroId = response.body.data.id;
    });

    it('should create a subrubro with parent', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Subrubro Test',
          parentId: testRubroId,
          marginRate: 20,
          isActive: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Subrubro Test');
      expect(response.body.data.parentId).toBe(testRubroId);
      expect(response.body.data.level).toBe(1);
      expect(response.body.data.path).toContain(testRubroId);
    });

    it('should return 400 for invalid name length', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'A',
          marginRate: 15
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.field).toBe('name');
    });

    it('should return 400 for invalid margin rate', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Rubro',
          marginRate: 150
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.field).toBe('margin_rate');
    });

    it('should return 409 for duplicate name at same level', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Rubro',
          marginRate: 15
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('CONFLICT');
      expect(response.body.field).toBe('name');
    });

    it('should return 404 for non-existent parent', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Subrubro',
          parentId: 'nonexistent-parent',
          marginRate: 15
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
      expect(response.body.field).toBe('parent_id');
    });
  });

  describe('GET /api/rubros', () => {
    it('should list rubros with pagination', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, size: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.page).toBe(1);
      expect(response.body.data.size).toBe(10);
    });

    it('should filter rubros by search query', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'Test Rubro' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items[0].name).toContain('Test Rubro');
    });

    it('should filter rubros by parent ID', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ parentId: testRubroId });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data.items[0].parentId).toBe(testRubroId);
    });

    it('should filter rubros by status', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'active' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.every(item => item.isActive === true)).toBe(true);
    });
  });

  describe('GET /api/rubros/:id', () => {
    it('should get rubro by ID', async () => {
      const response = await request(app)
        .get(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testRubroId);
      expect(response.body.data.name).toBe('Test Rubro');
    });

    it('should return 404 for non-existent rubro', async () => {
      const response = await request(app)
        .get('/api/rubros/nonexistent-rubro')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/rubros/:id', () => {
    it('should update rubro name', async () => {
      const response = await request(app)
        .put(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Test Rubro'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Rubro');
    });

    it('should update rubro margin rate', async () => {
      const response = await request(app)
        .put(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          marginRate: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.marginRate).toBe(25);
    });

    it('should update rubro active status', async () => {
      const response = await request(app)
        .put(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.isActive).toBe(false);
    });

    it('should return 400 for circular reference', async () => {
      // First create a subrubro
      const subrubroResponse = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Subrubro for Circular Test',
          parentId: testRubroId,
          marginRate: 20
        });

      const subrubroId = subrubroResponse.body.data.id;

      // Try to make the parent a child of its own child (circular reference)
      const response = await request(app)
        .put(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          parentId: subrubroId
        });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('CONFLICT');
      expect(response.body.field).toBe('parent_id');
    });

    it('should return 404 for non-existent rubro', async () => {
      const response = await request(app)
        .put('/api/rubros/nonexistent-rubro')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/rubros/:id', () => {
    it('should soft delete rubro without children', async () => {
      // Create a rubro without children
      const createResponse = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Rubro to Delete',
          marginRate: 15
        });

      const rubroId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/rubros/${rubroId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/rubros/${rubroId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 409 when trying to delete rubro with children', async () => {
      const response = await request(app)
        .delete(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(409);
      expect(response.body.code).toBe('CONFLICT');
      expect(response.body.reason).toBe('HAS_CHILDREN');
    });

    it('should force delete rubro with children when force=true', async () => {
      const response = await request(app)
        .delete(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ force: true });

      expect(response.status).toBe(204);
    });
  });

  describe('POST /api/rubros/:id/restore', () => {
    it('should restore soft-deleted rubro', async () => {
      // First create and delete a rubro
      const createResponse = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Rubro to Restore',
          marginRate: 15
        });

      const rubroId = createResponse.body.data.id;

      await request(app)
        .delete(`/api/rubros/${rubroId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Now restore it
      const restoreResponse = await request(app)
        .post(`/api/rubros/${rubroId}/restore`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(restoreResponse.status).toBe(200);
      expect(restoreResponse.body.success).toBe(true);
      expect(restoreResponse.body.data.id).toBe(rubroId);
      expect(restoreResponse.body.data.deletedAt).toBeNull();
      expect(restoreResponse.body.data.isActive).toBe(true);
    });

    it('should return 404 for non-deleted rubro', async () => {
      const response = await request(app)
        .post(`/api/rubros/${testRubroId}/restore`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/rubros/tree', () => {
    it('should return hierarchical rubro tree', async () => {
      const response = await request(app)
        .get('/api/rubros/tree')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/rubros/search', () => {
    it('should search rubros by name', async () => {
      const response = await request(app)
        .get('/api/rubros/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'Test' });

      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name).toContain('Test');
    });

    it('should return empty array for short search query', async () => {
      const response = await request(app)
        .get('/api/rubros/search')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ q: 'A' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('Authorization Tests', () => {
    let sellerToken;
    let viewerToken;

    beforeAll(async () => {
      // Create seller user (only read permission)
      const sellerUser = await prisma.user.create({
        data: {
          email: 'seller-rubros@example.com',
          passwordHash: 'hashed-password',
          name: 'Seller User Rubros',
          role: 'SELLER',
          companyId: testCompanyId
        }
      });

      sellerToken = jwt.sign(
        { 
          userId: sellerUser.id, 
          companyId: testCompanyId, 
          role: 'SELLER',
          permissions: ['inventory:rubros:read']
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Create viewer user (only read permission)
      const viewerUser = await prisma.user.create({
        data: {
          email: 'viewer-rubros@example.com',
          passwordHash: 'hashed-password',
          name: 'Viewer User Rubros',
          role: 'TECHNICIAN',
          companyId: testCompanyId
        }
      });

      viewerToken = jwt.sign(
        { 
          userId: viewerUser.id, 
          companyId: testCompanyId, 
          role: 'TECHNICIAN',
          permissions: ['inventory:rubros:read']
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );
    });

    it('should allow SELLER to read rubros', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny SELLER to create rubros', async () => {
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          name: 'Seller Test Rubro',
          marginRate: 15
        });

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });

    it('should allow TECHNICIAN to read rubros', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should deny TECHNICIAN to delete rubros', async () => {
      const response = await request(app)
        .delete(`/api/rubros/${testRubroId}`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('Multi-tenant Tests', () => {
    let otherCompanyToken;
    let otherRubroId;

    beforeAll(async () => {
      // Create another company
      const otherCompany = await prisma.company.create({
        data: {
          name: 'Other Company Rubros',
          taxId: 'OTHER-RUBROS-456'
        }
      });

      // Create user for other company
      const otherUser = await prisma.user.create({
        data: {
          email: 'other-rubros@example.com',
          passwordHash: 'hashed-password',
          name: 'Other User Rubros',
          role: 'ADMIN',
          companyId: otherCompany.id
        }
      });

      otherCompanyToken = jwt.sign(
        { 
          userId: otherUser.id, 
          companyId: otherCompany.id, 
          role: 'ADMIN',
          permissions: ['inventory:rubros:create', 'inventory:rubros:read', 'inventory:rubros:update', 'inventory:rubros:delete']
        },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      // Create rubro in other company
      const otherRubro = await prisma.category.create({
        data: {
          name: 'Other Company Rubro',
          marginRate: 10,
          isActive: true,
          companyId: otherCompany.id,
          level: 0,
          path: 'other-rubro-id'
        }
      });

      otherRubroId = otherRubro.id;
    });

    it('should not allow access to rubros from other companies', async () => {
      const response = await request(app)
        .get(`/api/rubros/${otherRubroId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should only list rubros from user company', async () => {
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${otherCompanyToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items.every(item => item.companyId === otherCompany.id)).toBe(true);
    });
  });
});