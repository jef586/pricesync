import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import ExcelJS from 'exceljs';

const API_BASE = 'http://localhost:3002/api';

// Datos de prueba para login
const testUser = {
  email: 'admin@empresatest.com',
  password: 'admin123'
};

let authToken = '';

async function login() {
  try {
    console.log('🔐 Iniciando sesión...');
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    if (!response.ok) {
      throw new Error(`Error en login: ${response.status}`);
    }

    const data = await response.json();
    console.log('📋 Respuesta completa:', JSON.stringify(data, null, 2));
    
    // La estructura es data.data.tokens.accessToken
    if (data.data && data.data.tokens && data.data.tokens.accessToken) {
      authToken = data.data.tokens.accessToken;
      console.log('✅ Login exitoso');
      console.log('🔑 Token obtenido:', authToken.substring(0, 20) + '...');
      return data;
    } else {
      throw new Error('Token no encontrado en la respuesta');
    }
  } catch (error) {
    console.error('❌ Error en login:', error.message);
    throw error;
  }
}

async function createTestSupplier() {
  try {
    console.log('🏭 Creando proveedor de prueba...');
    const supplierData = {
      name: 'Proveedor Test Excel',
      code: `TEST-${Date.now()}`, // Código único basado en timestamp
      email: 'test@proveedor.com',
      phone: '123456789',
      address: 'Calle Test 123',
      city: 'Ciudad Test',
      state: 'Estado Test',
      country: 'País Test',
      postalCode: '12345',
      taxId: `TAX-${Date.now()}`, // Tax ID único
      contactName: 'Contacto Test',
      contactPhone: '987654321',
      contactEmail: 'contacto@proveedor.com',
      paymentTerms: 30,
      currency: 'ARS',
      status: 'active'
    };

    const response = await fetch(`${API_BASE}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(supplierData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error creando proveedor: ${error.error}`);
    }

    const supplier = await response.json();
    console.log('✅ Proveedor creado:', supplier.name);
    return supplier;
  } catch (error) {
    console.error('❌ Error creando proveedor:', error.message);
    throw error;
  }
}

async function createTestExcelFile() {
  try {
    console.log('📊 Creando archivo Excel de prueba...');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos');

    // Encabezados
    const headers = [
      'Código Proveedor',
      'Nombre Producto',
      'Descripción',
      'Precio Costo',
      'Precio Lista',
      'Marca',
      'Modelo',
      'Año',
      'Número OEM',
      'Cantidad Mínima',
      'Tiempo Entrega (días)',
      'Moneda'
    ];

    worksheet.addRow(headers);

    // Datos de prueba
    const testProducts = [
      [
        'FILTRO001',
        'Filtro de Aceite Toyota',
        'Filtro de aceite para motor Toyota Corolla',
        25.50,
        35.00,
        'Toyota',
        'Corolla',
        '2020-2023',
        '90915-YZZD4',
        1,
        7,
        'ARS'
      ],
      [
        'PASTILLA001',
        'Pastillas de Freno Ford',
        'Pastillas de freno delanteras Ford Focus',
        45.00,
        65.00,
        'Ford',
        'Focus',
        '2018-2022',
        'CV6Z-2001-A',
        2,
        5,
        'ARS'
      ],
      [
        'ACEITE001',
        'Aceite Motor 5W30',
        'Aceite sintético para motor 5W30',
        120.00,
        180.00,
        'Castrol',
        'GTX',
        '2023',
        'GTX-5W30-4L',
        4,
        3,
        'ARS'
      ]
    ];

    testProducts.forEach(product => {
      worksheet.addRow(product);
    });

    // Formatear encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Ajustar ancho de columnas
    worksheet.columns.forEach((column, index) => {
      column.width = Math.max(headers[index].length + 2, 15);
    });

    const filePath = './test-productos-excel.xlsx';
    await workbook.xlsx.writeFile(filePath);
    console.log('✅ Archivo Excel creado:', filePath);
    return filePath;
  } catch (error) {
    console.error('❌ Error creando archivo Excel:', error.message);
    throw error;
  }
}

async function testExcelPreview(supplierId, filePath) {
  try {
    console.log('👀 Probando vista previa de Excel...');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    const response = await fetch(`${API_BASE}/suppliers/import/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error en vista previa: ${error.error}`);
    }

    const preview = await response.json();
    console.log('✅ Vista previa exitosa:');
    console.log(`   - Total filas: ${preview.summary.totalRows}`);
    console.log(`   - Filas válidas: ${preview.summary.validRows}`);
    console.log(`   - Filas inválidas: ${preview.summary.invalidRows}`);
    
    if (preview.errors.length > 0) {
      console.log('⚠️  Errores encontrados:');
      preview.errors.forEach(error => {
        console.log(`   - Fila ${error.row}: ${error.errors.join(', ')}`);
      });
    }

    return preview;
  } catch (error) {
    console.error('❌ Error en vista previa:', error.message);
    throw error;
  }
}

async function testExcelImport(supplierId, filePath) {
  try {
    console.log('📥 Probando importación de Excel...');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('supplierId', supplierId);

    const response = await fetch(`${API_BASE}/suppliers/import/execute`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error en importación: ${error.error}`);
    }

    const result = await response.json();
    console.log('✅ Importación exitosa:');
    console.log(`   - Productos importados: ${result.imported}`);
    console.log(`   - Productos actualizados: ${result.updated}`);
    console.log(`   - Errores: ${result.errors}`);
    
    return result;
  } catch (error) {
    console.error('❌ Error en importación:', error.message);
    throw error;
  }
}

async function testDownloadTemplate() {
  try {
    console.log('📋 Probando descarga de plantilla...');
    
    const response = await fetch(`${API_BASE}/suppliers/import/template`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error descargando plantilla: ${response.status}`);
    }

    const buffer = await response.buffer();
    fs.writeFileSync('./plantilla-descargada.xlsx', buffer);
    console.log('✅ Plantilla descargada: ./plantilla-descargada.xlsx');
    
    return true;
  } catch (error) {
    console.error('❌ Error descargando plantilla:', error.message);
    throw error;
  }
}

async function testSupplierProducts(supplierId) {
  try {
    console.log('📦 Verificando productos del proveedor...');
    
    const response = await fetch(`${API_BASE}/suppliers/${supplierId}/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Error obteniendo productos: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Productos del proveedor:');
    console.log(`   - Total productos: ${data.pagination.total}`);
    
    data.products.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.supplierCode} - ${product.supplierName} ($${product.costPrice})`);
    });

    return data;
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error.message);
    throw error;
  }
}

async function cleanup(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🧹 Archivo de prueba eliminado');
    }
    if (fs.existsSync('./plantilla-descargada.xlsx')) {
      fs.unlinkSync('./plantilla-descargada.xlsx');
      console.log('🧹 Plantilla descargada eliminada');
    }
  } catch (error) {
    console.log('⚠️  Error en limpieza:', error.message);
  }
}

async function runTests() {
  let supplier = null;
  let filePath = null;

  try {
    console.log('🚀 Iniciando pruebas de importación Excel...\n');

    // 1. Login
    await login();

    // 2. Crear proveedor de prueba
    supplier = await createTestSupplier();

    // 3. Crear archivo Excel de prueba
    filePath = await createTestExcelFile();

    // 4. Probar descarga de plantilla
    await testDownloadTemplate();

    // 5. Probar vista previa
    await testExcelPreview(supplier.id, filePath);

    // 6. Probar importación
    await testExcelImport(supplier.id, filePath);

    // 7. Verificar productos importados
    await testSupplierProducts(supplier.id);

    console.log('\n🎉 ¡Todas las pruebas completadas exitosamente!');

  } catch (error) {
    console.error('\n💥 Error en las pruebas:', error.message);
    process.exit(1);
  } finally {
    // Limpieza
    if (filePath) {
      await cleanup(filePath);
    }
  }
}

// Ejecutar pruebas
runTests();