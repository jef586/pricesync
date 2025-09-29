import prisma from '../config/database.js';

class CustomerController {
  // Buscar clientes
  static async searchCustomers(req, res) {
    try {
      const { q: query, limit = 10 } = req.query;
      const companyId = req.user.company.id;

      if (!query || query.length < 2) {
        return res.json([]);
      }

      const customers = await prisma.customer.findMany({
        where: {
          companyId,
          deletedAt: null,
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              email: {
                contains: query,
                mode: 'insensitive'
              }
            },
            {
              taxId: {
                contains: query,
                mode: 'insensitive'
              }
            }
          ]
        },
        select: {
          id: true,
          code: true,
          name: true,
          email: true,
          taxId: true,
          address: true,
          city: true,
          state: true,
          country: true,
          phone: true,
          type: true,
          status: true
        },
        take: parseInt(limit),
        orderBy: {
          name: 'asc'
        }
      });

      res.json(customers);
    } catch (error) {
      console.error('Error searching customers:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron buscar los clientes'
      });
    }
  }

  // Obtener todos los clientes
  static async getCustomers(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search, 
        type, 
        status = 'active' 
      } = req.query;
      
      const companyId = req.user.company.id;
      const skip = (page - 1) * limit;

      const where = {
        companyId,
        deletedAt: null,
        ...(status && { status }),
        ...(type && { type }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { taxId: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          select: {
            id: true,
            code: true,
            name: true,
            email: true,
            taxId: true,
            address: true,
            city: true,
            state: true,
            country: true,
            phone: true,
            type: true,
            status: true,
            creditLimit: true,
            paymentTerms: true,
            createdAt: true
          },
          skip,
          take: parseInt(limit),
          orderBy: {
            name: 'asc'
          }
        }),
        prisma.customer.count({ where })
      ]);

      res.json({
        customers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudieron obtener los clientes'
      });
    }
  }

  // Obtener cliente por ID
  static async getCustomerById(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      const customer = await prisma.customer.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!customer) {
        return res.status(404).json({ 
          error: 'Cliente no encontrado',
          message: 'El cliente solicitado no existe o no pertenece a su empresa'
        });
      }

      res.json(customer);
    } catch (error) {
      console.error('Error fetching customer:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo obtener el cliente'
      });
    }
  }

  // Crear cliente
  static async createCustomer(req, res) {
    try {
      const companyId = req.user.company.id;
      const {
        name,
        email,
        taxId,
        type = 'individual',
        phone,
        address,
        city,
        state,
        country = 'Argentina',
        creditLimit = 0,
        paymentTerms = 0
      } = req.body;

      // Validaciones básicas
      if (!name) {
        return res.status(400).json({
          error: 'Datos inválidos',
          message: 'El nombre del cliente es requerido'
        });
      }

      // Verificar si ya existe un cliente con el mismo email o taxId
      if (email || taxId) {
        const existingCustomer = await prisma.customer.findFirst({
          where: {
            companyId,
            deletedAt: null,
            OR: [
              ...(email ? [{ email }] : []),
              ...(taxId ? [{ taxId }] : [])
            ]
          }
        });

        if (existingCustomer) {
          return res.status(400).json({
            error: 'Cliente duplicado',
            message: 'Ya existe un cliente con ese email o CUIT/DNI'
          });
        }
      }

      // Generar código único
      const customerCount = await prisma.customer.count({
        where: { companyId, deletedAt: null }
      });
      const code = `CLI-${(customerCount + 1).toString().padStart(4, '0')}`;

      const customer = await prisma.customer.create({
        data: {
          code,
          name,
          email,
          taxId,
          type,
          phone,
          address,
          city,
          state,
          country,
          creditLimit: parseFloat(creditLimit) || 0,
          paymentTerms: parseInt(paymentTerms) || 0,
          status: 'active',
          companyId
        }
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error('Error creating customer:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo crear el cliente'
      });
    }
  }

  // Actualizar cliente
  static async updateCustomer(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;
      const updateData = req.body;

      // Verificar que el cliente existe y pertenece a la empresa
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!existingCustomer) {
        return res.status(404).json({
          error: 'Cliente no encontrado',
          message: 'El cliente solicitado no existe o no pertenece a su empresa'
        });
      }

      // Actualizar cliente
      const customer = await prisma.customer.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      res.json(customer);
    } catch (error) {
      console.error('Error updating customer:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo actualizar el cliente'
      });
    }
  }

  // Eliminar cliente (soft delete)
  static async deleteCustomer(req, res) {
    try {
      const { id } = req.params;
      const companyId = req.user.company.id;

      // Verificar que el cliente existe y pertenece a la empresa
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          id,
          companyId,
          deletedAt: null
        }
      });

      if (!existingCustomer) {
        return res.status(404).json({
          error: 'Cliente no encontrado',
          message: 'El cliente solicitado no existe o no pertenece a su empresa'
        });
      }

      // Verificar si el cliente tiene facturas asociadas
      const invoiceCount = await prisma.invoice.count({
        where: {
          customerId: id,
          deletedAt: null
        }
      });

      if (invoiceCount > 0) {
        return res.status(400).json({
          error: 'No se puede eliminar',
          message: 'El cliente tiene facturas asociadas y no puede ser eliminado'
        });
      }

      // Soft delete
      await prisma.customer.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'inactive'
        }
      });

      res.json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
      console.error('Error deleting customer:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        message: 'No se pudo eliminar el cliente'
      });
    }
  }
}

export default CustomerController;