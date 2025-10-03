const ExcelJS = require('exceljs');
const fs = require('fs');

async function crearArchivoExcelPrueba() {
  try {
    console.log('📝 Creando archivo Excel de prueba para importación de productos de proveedores...');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Productos Proveedor');

    // Definir encabezados según la estructura requerida
    const headers = [
      'Código Proveedor',      // Columna 1: supplierCode
      'Nombre Producto',       // Columna 2: supplierName
      'Descripción',           // Columna 3: description
      'Precio Costo',          // Columna 4: costPrice
      'Precio Lista',          // Columna 5: listPrice
      'Marca',                 // Columna 6: brand
      'Modelo',                // Columna 7: model
      'Año',                   // Columna 8: year
      'Número OEM',            // Columna 9: oem
      'Cantidad Mínima',       // Columna 10: minQuantity
      'Tiempo Entrega (días)', // Columna 11: leadTime
      'Moneda'                 // Columna 12: currency
    ];

    // Agregar encabezados
    worksheet.addRow(headers);

    // Formatear encabezados
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Datos de prueba válidos
    const datosProductos = [
      [
        'PROD001',
        'Filtro de Aceite Toyota Corolla',
        'Filtro de aceite para motor Toyota Corolla 2020-2023',
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
        'PROD002',
        'Pastillas de Freno Ford Focus',
        'Pastillas de freno delanteras Ford Focus 2018-2022',
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
        'PROD003',
        'Amortiguador Chevrolet Cruze',
        'Amortiguador delantero derecho Chevrolet Cruze',
        120.00,
        180.00,
        'Chevrolet',
        'Cruze',
        '2016-2020',
        '13503289',
        1,
        10,
        'ARS'
      ],
      [
        'PROD004',
        'Bujía NGK Honda Civic',
        'Bujía de encendido NGK para Honda Civic',
        8.50,
        12.00,
        'Honda',
        'Civic',
        '2019-2023',
        'IZFR6K13',
        4,
        3,
        'ARS'
      ],
      [
        'PROD005',
        'Correa de Distribución Volkswagen Golf',
        'Correa de distribución para Volkswagen Golf 1.6L',
        35.00,
        50.00,
        'Volkswagen',
        'Golf',
        '2017-2021',
        '03C109119C',
        1,
        7,
        'ARS'
      ],
      [
        'PROD006',
        'Radiador Nissan Sentra',
        'Radiador de enfriamiento Nissan Sentra',
        180.00,
        250.00,
        'Nissan',
        'Sentra',
        '2020-2023',
        '21460-3TA0A',
        1,
        14,
        'ARS'
      ],
      [
        'PROD007',
        'Batería Moura Hyundai Elantra',
        'Batería 12V 60Ah para Hyundai Elantra',
        95.00,
        130.00,
        'Hyundai',
        'Elantra',
        '2018-2022',
        'M60GD',
        1,
        5,
        'ARS'
      ],
      [
        'PROD008',
        'Llanta Aleación Mazda 3',
        'Llanta de aleación 16" para Mazda 3',
        150.00,
        220.00,
        'Mazda',
        '3',
        '2019-2023',
        '9965-77-6560',
        1,
        21,
        'ARS'
      ],
      [
        'PROD009',
        'Espejo Retrovisor Kia Rio',
        'Espejo retrovisor izquierdo Kia Rio',
        65.00,
        95.00,
        'Kia',
        'Rio',
        '2017-2021',
        '87610-1W000',
        1,
        12,
        'ARS'
      ],
      [
        'PROD010',
        'Sensor de Oxígeno Subaru Impreza',
        'Sensor de oxígeno lambda Subaru Impreza',
        85.00,
        120.00,
        'Subaru',
        'Impreza',
        '2016-2020',
        '22641-AA381',
        1,
        8,
        'ARS'
      ]
    ];

    // Agregar datos de prueba
    datosProductos.forEach(producto => {
      worksheet.addRow(producto);
    });

    // Ajustar ancho de columnas
    worksheet.columns.forEach((column, index) => {
      column.width = Math.max(headers[index].length + 2, 15);
    });

    // Guardar archivo
    const nombreArchivo = 'productos-proveedores-test.xlsx';
    await workbook.xlsx.writeFile(nombreArchivo);
    
    console.log('✅ Archivo Excel creado exitosamente:', nombreArchivo);
    console.log('📋 El archivo contiene:');
    console.log(`   - ${headers.length} columnas requeridas`);
    console.log(`   - ${datosProductos.length} productos de prueba`);
    console.log('   - Datos válidos para importación');
    
    return nombreArchivo;
    
  } catch (error) {
    console.error('❌ Error creando archivo Excel:', error.message);
    throw error;
  }
}

// Ejecutar la función
crearArchivoExcelPrueba()
  .then(archivo => {
    console.log(`\n🎉 ¡Listo! Puedes usar el archivo "${archivo}" para probar la importación.`);
    console.log('\n📝 Instrucciones de uso:');
    console.log('1. Ve a la sección de Proveedores en la aplicación');
    console.log('2. Selecciona un proveedor existente');
    console.log('3. Haz clic en "Importar Excel"');
    console.log('4. Sube el archivo generado');
    console.log('5. Revisa la vista previa y confirma la importación');
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });