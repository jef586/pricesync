import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestProducts() {
  try {
    console.log('🚀 Iniciando creación de productos de prueba...');

    // Obtener la primera empresa disponible
    const company = await prisma.company.findFirst();
    if (!company) {
      console.error('❌ No se encontró ninguna empresa. Ejecuta create-test-company.js primero.');
      return;
    }

    console.log(`📊 Usando empresa: ${company.name}`);

    // Crear categorías de prueba
    const categories = [
      { name: 'Electrónicos', description: 'Dispositivos electrónicos y tecnología' },
      { name: 'Ropa', description: 'Prendas de vestir y accesorios' },
      { name: 'Hogar', description: 'Artículos para el hogar y decoración' },
      { name: 'Deportes', description: 'Equipamiento deportivo y fitness' },
      { name: 'Libros', description: 'Libros y material educativo' }
    ];

    const createdCategories = [];
    for (const cat of categories) {
      // Buscar si ya existe la categoría
      let category = await prisma.category.findFirst({
        where: {
          companyId: company.id,
          name: cat.name
        }
      });

      // Si no existe, crearla
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: cat.name,
            description: cat.description,
            companyId: company.id
          }
        });
      }
      
      createdCategories.push(category);
    }

    console.log('📂 Categorías creadas:', createdCategories.length);

    // Productos de prueba con variedad
    const testProducts = [
      // Electrónicos
      {
        code: 'ELEC001',
        name: 'Smartphone Samsung Galaxy',
        description: 'Teléfono inteligente con pantalla AMOLED de 6.1 pulgadas',
        salePrice: 45000.00,
        costPrice: 35000.00,
        stock: 25,
        minStock: 5,
        categoryId: createdCategories[0].id
      },
      {
        code: 'ELEC002',
        name: 'Laptop HP Pavilion',
        description: 'Laptop con procesador Intel i5, 8GB RAM, 256GB SSD',
        salePrice: 85000.00,
        costPrice: 65000.00,
        stock: 15,
        minStock: 3,
        categoryId: createdCategories[0].id
      },
      {
        code: 'ELEC003',
        name: 'Auriculares Bluetooth',
        description: 'Auriculares inalámbricos con cancelación de ruido',
        salePrice: 12000.00,
        costPrice: 8000.00,
        stock: 50,
        minStock: 10,
        categoryId: createdCategories[0].id
      },
      
      // Ropa
      {
        code: 'ROPA001',
        name: 'Camiseta Polo Clásica',
        description: 'Camiseta polo de algodón 100% en varios colores',
        salePrice: 2500.00,
        costPrice: 1500.00,
        stock: 80,
        minStock: 15,
        categoryId: createdCategories[1].id
      },
      {
        code: 'ROPA002',
        name: 'Jeans Denim Premium',
        description: 'Pantalón jeans de corte clásico, tela premium',
        salePrice: 4500.00,
        costPrice: 2800.00,
        stock: 60,
        minStock: 12,
        categoryId: createdCategories[1].id
      },
      {
        code: 'ROPA003',
        name: 'Zapatillas Deportivas',
        description: 'Zapatillas para running con tecnología de amortiguación',
        salePrice: 8500.00,
        costPrice: 5500.00,
        stock: 35,
        minStock: 8,
        categoryId: createdCategories[1].id
      },
      
      // Hogar
      {
        code: 'HOGAR001',
        name: 'Cafetera Automática',
        description: 'Cafetera programable con filtro permanente',
        salePrice: 15000.00,
        costPrice: 10000.00,
        stock: 20,
        minStock: 4,
        categoryId: createdCategories[2].id
      },
      {
        code: 'HOGAR002',
        name: 'Juego de Sábanas',
        description: 'Juego de sábanas de algodón percal, 4 piezas',
        salePrice: 3500.00,
        costPrice: 2200.00,
        stock: 45,
        minStock: 10,
        categoryId: createdCategories[2].id
      },
      {
        code: 'HOGAR003',
        name: 'Lámpara de Mesa LED',
        description: 'Lámpara de escritorio con regulador de intensidad',
        salePrice: 6500.00,
        costPrice: 4000.00,
        stock: 30,
        minStock: 6,
        categoryId: createdCategories[2].id
      },
      
      // Deportes
      {
        code: 'DEP001',
        name: 'Pelota de Fútbol',
        description: 'Pelota oficial FIFA, cuero sintético',
        salePrice: 3200.00,
        costPrice: 2000.00,
        stock: 40,
        minStock: 8,
        categoryId: createdCategories[3].id
      },
      {
        code: 'DEP002',
        name: 'Raqueta de Tenis',
        description: 'Raqueta profesional de grafito, peso 300g',
        salePrice: 18000.00,
        costPrice: 12000.00,
        stock: 12,
        minStock: 3,
        categoryId: createdCategories[3].id
      },
      {
        code: 'DEP003',
        name: 'Pesas Ajustables',
        description: 'Set de pesas ajustables de 5kg a 25kg',
        salePrice: 22000.00,
        costPrice: 15000.00,
        stock: 8,
        minStock: 2,
        categoryId: createdCategories[3].id
      },
      
      // Libros
      {
        code: 'LIB001',
        name: 'Manual de JavaScript',
        description: 'Guía completa de programación en JavaScript',
        salePrice: 4800.00,
        costPrice: 3000.00,
        stock: 25,
        minStock: 5,
        categoryId: createdCategories[4].id
      },
      {
        code: 'LIB002',
        name: 'Novela Bestseller',
        description: 'Novela de ficción contemporánea, tapa blanda',
        salePrice: 2200.00,
        costPrice: 1400.00,
        stock: 55,
        minStock: 12,
        categoryId: createdCategories[4].id
      },
      {
        code: 'LIB003',
        name: 'Enciclopedia Digital',
        description: 'Enciclopedia multimedia en formato digital',
        salePrice: 7500.00,
        costPrice: 4500.00,
        stock: 18,
        minStock: 4,
        categoryId: createdCategories[4].id
      },
      
      // Productos con stock bajo para pruebas
      {
        code: 'STOCK001',
        name: 'Producto Stock Bajo',
        description: 'Producto para probar alertas de stock bajo',
        salePrice: 1500.00,
        costPrice: 1000.00,
        stock: 2,
        minStock: 10,
        categoryId: createdCategories[0].id
      },
      {
        code: 'STOCK002',
        name: 'Artículo Agotándose',
        description: 'Artículo con stock crítico',
        salePrice: 3000.00,
        costPrice: 2000.00,
        stock: 1,
        minStock: 5,
        categoryId: createdCategories[1].id
      }
    ];

    // Crear artículos (nuevo modelo)
    const createdProducts = [];
    for (const productData of testProducts) {
      const article = await prisma.article.upsert({
        where: { 
          sku: productData.code
        },
        update: {},
        create: {
          sku: productData.code,
          name: productData.name,
          description: productData.description,
          categoryId: productData.categoryId || null,
          type: 'PRODUCT',
          taxRate: 21,
          cost: productData.costPrice,
          pricePublic: productData.salePrice,
          stock: productData.stock || 0,
          stockMin: productData.minStock || null,
          companyId: company.id
        }
      });
      createdProducts.push(article);
    }

    console.log('📦 Productos creados:', createdProducts.length);
    
    // Mostrar resumen
    const totalValue = createdProducts.reduce((sum, product) => 
      sum + (Number(product.pricePublic) * product.stock), 0
    );
    
    const lowStockCount = createdProducts.filter(product => 
      product.stockMin && product.stock <= product.stockMin
    ).length;

    console.log('\n📊 RESUMEN DE PRODUCTOS CREADOS:');
    console.log(`   • Total productos: ${createdProducts.length}`);
    console.log(`   • Categorías: ${createdCategories.length}`);
    console.log(`   • Productos con stock bajo: ${lowStockCount}`);
    console.log(`   • Valor total del inventario: $${totalValue.toLocaleString()}`);
    console.log('\n✅ ¡Datos de prueba creados exitosamente!');
    console.log('   Ahora puedes ver los productos en la tabla del inventario.');

  } catch (error) {
    console.error('❌ Error creando productos de prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProducts().catch(console.error);