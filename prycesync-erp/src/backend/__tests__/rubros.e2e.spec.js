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

  describe('POST /api/rubros/:id/restore?cascade=true', () => {
    it('should restore rubro and its children when cascade=true', async () => {
      const parentResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Parent Restore', marginRate: 10 });

      const childResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Child Restore', parentId: parentResp.body.data.id });

      await request(app)
        .delete(`/api/rubros/${childResp.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      await request(app)
        .delete(`/api/rubros/${parentResp.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const restoreResp = await request(app)
        .post(`/api/rubros/${parentResp.body.data.id}/restore`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ cascade: true });

      expect(restoreResp.status).toBe(200);
      const childGet = await request(app)
        .get(`/api/rubros/${childResp.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(childGet.status).toBe(200);
      expect(childGet.body.data.deletedAt).toBeNull();
    });
  });

  describe('DELETE /api/rubros/:id/permanent', () => {
    it('should return 409 when deleting with children and force=false', async () => {
      const parentResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Parent Hard', marginRate: 10 });

      await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Child Hard', parentId: parentResp.body.data.id });

      const delResp = await request(app)
        .delete(`/api/rubros/${parentResp.body.data.id}/permanent`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(delResp.status).toBe(409);
    });

    it('should hard delete parent and children when force=true', async () => {
      const parentResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Parent Hard 2' });

      const childResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Child Hard 2', parentId: parentResp.body.data.id });

      const delResp = await request(app)
        .delete(`/api/rubros/${parentResp.body.data.id}/permanent`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ force: true });

      expect(delResp.status).toBe(204);

      const getParent = await request(app)
        .get(`/api/rubros/${parentResp.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getParent.status).toBe(404);

      const getChild = await request(app)
        .get(`/api/rubros/${childResp.body.data.id}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(getChild.status).toBe(404);
    });

    it('should block hard delete when articles are associated', async () => {
      const catResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'With Articles' });

      await prisma.article.create({
        data: {
          name: 'A1',
          sku: 'SKU-A1',
          pricePublic: 100,
          companyId: testCompanyId,
          categoryId: catResp.body.data.id,
          taxRate: 21
        }
      });

      const delResp = await request(app)
        .delete(`/api/rubros/${catResp.body.data.id}/permanent`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(delResp.status).toBe(409);
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

  describe('PUT /api/rubros/:id/move', () => {
    it('should move subrubro to root', async () => {
      const rootResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Root A', marginRate: 10 });

      const childResp = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Child A1', parentId: rootResp.body.data.id });

      const moveResp = await request(app)
        .put(`/api/rubros/${childResp.body.data.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ new_parent_id: null });

      expect(moveResp.status).toBe(200);
      expect(moveResp.body.success).toBe(true);
      expect(moveResp.body.data.parentId).toBeNull();
      expect(moveResp.body.data.level).toBe(0);
      expect(moveResp.body.data.path).toBe(moveResp.body.data.id);
    });

    it('should move rubro under another parent and update path/level', async () => {
      const parentA = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Parent B' });

      const nodeX = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Node X' });

      const moveResp = await request(app)
        .put(`/api/rubros/${nodeX.body.data.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ new_parent_id: parentA.body.data.id });

      expect(moveResp.status).toBe(200);
      expect(moveResp.body.data.parentId).toBe(parentA.body.data.id);
      expect(moveResp.body.data.level).toBe(1);
      expect(moveResp.body.data.path).toContain(parentA.body.data.id);
    });

    it('should reject cycle when moving ancestor under descendant', async () => {
      const a = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'A' });

      const b = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'B', parentId: a.body.data.id });

      const c = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'C', parentId: b.body.data.id });

      const resp = await request(app)
        .put(`/api/rubros/${a.body.data.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ new_parent_id: c.body.data.id });

      expect(resp.status).toBe(409);
      expect(resp.body.code).toBe('CONFLICT');
      expect(resp.body.field).toBe('parent_id');
    });

    it('should return 404 when parent belongs to another company', async () => {
      const otherCompany = await prisma.company.create({ data: { name: 'Co Y', taxId: 'COY-999' } });
      const otherParent = await prisma.category.create({ data: { name: 'Other P', companyId: otherCompany.id, level: 0, path: 'other-p' } });

      const node = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Cross Node' });

      const resp = await request(app)
        .put(`/api/rubros/${node.body.data.id}/move`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ new_parent_id: otherParent.id });

      expect(resp.status).toBe(404);
      expect(resp.body.code).toBe('NOT_FOUND');
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
