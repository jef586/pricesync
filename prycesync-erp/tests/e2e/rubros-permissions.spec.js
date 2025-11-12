const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Helper para crear usuario de prueba
async function createTestUser(role, companyId) {
  const email = `test-${role.toLowerCase()}-${Date.now()}@test.com`;
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: password
      name: `Test ${role}`,
      role,
      status: 'active',
      companyId
    }
  });
  return user;
}

// Helper para crear empresa de prueba
async function createTestCompany() {
  const company = await prisma.company.create({
    data: {
      name: `Test Company ${Date.now()}`,
      taxId: `TEST${Date.now()}`,
      email: `test-${Date.now()}@company.com`,
      phone: '1234567890',
      address: 'Test Address',
      city: 'Test City',
      country: 'AR'
    }
  });
  return company;
}

// Helper para crear rubro de prueba
async function createTestRubro(companyId, parentId = null) {
  const rubro = await prisma.category.create({
    data: {
      name: `Test Rubro ${Date.now()}`,
      description: 'Test rubro description',
      companyId,
      parentId
    }
  });
  return rubro;
}

// Helper para obtener token JWT
async function getAuthToken(app, email, password = 'password') {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });
  
  return response.body.token;
}

describe('Rubros Permissions E2E Tests', () => {
  let app;
  let companyA, companyB;
  let adminUser, managerUser, sellerUser, technicianUser;
  let adminToken, managerToken, sellerToken, technicianToken;
  let testRubroA, testRubroB;

  beforeAll(async () => {
    // Importar la app
    app = require('../src/backend/server.js');
    
    // Crear empresas de prueba
    companyA = await createTestCompany();
    companyB = await createTestCompany();
    
    // Crear usuarios de prueba
    adminUser = await createTestUser('ADMIN', companyA.id);
    managerUser = await createTestUser('SUPERVISOR', companyA.id);
    sellerUser = await createTestUser('SELLER', companyA.id);
    technicianUser = await createTestUser('TECHNICIAN', companyA.id);
    
    // Obtener tokens
    adminToken = await getAuthToken(app, adminUser.email);
    managerToken = await getAuthToken(app, managerUser.email);
    sellerToken = await getAuthToken(app, sellerUser.email);
    technicianToken = await getAuthToken(app, technicianUser.email);
    
    // Crear rubros de prueba
    testRubroA = await createTestRubro(companyA.id);
    testRubroB = await createTestRubro(companyB.id);
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prisma.category.deleteMany({
      where: {
        companyId: { in: [companyA.id, companyB.id] }
      }
    });
    
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminUser.id, managerUser.id, sellerUser.id, technicianUser.id] }
      }
    });
    
    await prisma.company.deleteMany({
      where: {
        id: { in: [companyA.id, companyB.id] }
      }
    });
    
    await prisma.$disconnect();
  });

  describe('GET /api/rubros', () => {
    it('should allow all roles to read rubros', async () => {
      const tokens = [adminToken, managerToken, sellerToken, technicianToken];
      
      for (const token of tokens) {
        const response = await request(app)
          .get('/api/rubros')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should only show rubros from user\'s company', async () => {
      // Admin from company A should only see rubros from company A
      const response = await request(app)
        .get('/api/rubros')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.every(rubro => rubro.companyId === companyA.id)).toBe(true);
      expect(response.body.data.some(rubro => rubro.id === testRubroA.id)).toBe(true);
      expect(response.body.data.some(rubro => rubro.id === testRubroB.id)).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/rubros');
      
      expect(response.status).toBe(401);
      expect(response.body.code).toBe('MISSING_TOKEN');
    });
  });

  describe('POST /api/rubros', () => {
    it('should allow ADMIN to create rubros', async () => {
      const newRubro = {
        name: 'New Admin Rubro',
        description: 'Created by admin'
      };
      
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRubro);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(newRubro.name);
      expect(response.body.data.companyId).toBe(companyA.id);
    });

    it('should allow SUPERVISOR to create rubros', async () => {
      const newRubro = {
        name: 'New Manager Rubro',
        description: 'Created by manager'
      };
      
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(newRubro);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should not allow SELLER to create rubros', async () => {
      const newRubro = {
        name: 'New Seller Rubro',
        description: 'Created by seller'
      };
      
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(newRubro);
      
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
      expect(response.body.missing).toContain('inventory:rubros:create');
    });

    it('should not allow TECHNICIAN to create rubros', async () => {
      const newRubro = {
        name: 'New Technician Rubro',
        description: 'Created by technician'
      };
      
      const response = await request(app)
        .post('/api/rubros')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send(newRubro);
      
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });
  });

  describe('PUT /api/rubros/:id', () => {
    it('should allow ADMIN to update rubros', async () => {
      const updatedData = {
        name: 'Updated Admin Rubro',
        description: 'Updated by admin'
      };
      
      const response = await request(app)
        .put(`/api/rubros/${testRubroA.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updatedData.name);
    });

    it('should allow SUPERVISOR to update rubros', async () => {
      const updatedData = {
        name: 'Updated Manager Rubro',
        description: 'Updated by manager'
      };
      
      const response = await request(app)
        .put(`/api/rubros/${testRubroA.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should not allow SELLER to update rubros', async () => {
      const updatedData = {
        name: 'Updated Seller Rubro',
        description: 'Updated by seller'
      };
      
      const response = await request(app)
        .put(`/api/rubros/${testRubroA.id}`)
        .set('Authorization', `Bearer ${sellerToken}`)
        .send(updatedData);
      
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
      expect(response.body.missing).toContain('inventory:rubros:update');
    });

    it('should not allow cross-company updates', async () => {
      const updatedData = {
        name: 'Cross-company update attempt'
      };
      
      // User from company A trying to update rubro from company B
      const response = await request(app)
        .put(`/api/rubros/${testRubroB.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('no encontrada');
    });
  });

  describe('DELETE /api/rubros/:id', () => {
    let deletableRubroA, deletableRubroB;

    beforeAll(async () => {
      // Crear rubros específicos para eliminar
      deletableRubroA = await createTestRubro(companyA.id);
      deletableRubroB = await createTestRubro(companyB.id);
    });

    it('should allow ADMIN to delete rubros', async () => {
      const response = await request(app)
        .delete(`/api/rubros/${deletableRubroA.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('eliminada');
    });

    it('should not allow SUPERVISOR to delete rubros', async () => {
      const response = await request(app)
        .delete(`/api/rubros/${deletableRubroA.id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
      expect(response.body.missing).toContain('inventory:rubros:delete');
    });

    it('should not allow SELLER to delete rubros', async () => {
      const response = await request(app)
        .delete(`/api/rubros/${deletableRubroA.id}`)
        .set('Authorization', `Bearer ${sellerToken}`);
      
      expect(response.status).toBe(403);
      expect(response.body.code).toBe('PERMISSION_DENIED');
    });

    it('should not allow cross-company deletion', async () => {
      // User from company A trying to delete rubro from company B
      const response = await request(app)
        .delete(`/api/rubros/${deletableRubroB.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toContain('no encontrada');
    });
  });

  describe('GET /api/rubros/tree', () => {
    it('should return hierarchical tree for all authorized roles', async () => {
      const tokens = [adminToken, managerToken, sellerToken, technicianToken];
      
      for (const token of tokens) {
        const response = await request(app)
          .get('/api/rubros/tree')
          .set('Authorization', `Bearer ${token}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        // Should only contain rubros from user's company
        expect(response.body.data.every(rubro => rubro.companyId === companyA.id)).toBe(true);
      }
    });
  });

  describe('GET /api/rubros/search', () => {
    it('should search rubros with proper permissions', async () => {
      const response = await request(app)
        .get('/api/rubros/search?q=Test')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // Should only return results from user's company
      expect(response.body.every(rubro => rubro.companyId === companyA.id)).toBe(true);
    });
  });
});