const XLSX = require('xlsx');
const path = require('path');

// Datos de prueba para productos de proveedores
const testData = [
  {
    supplierCode: 'PROD001',
    supplierName: 'Filtro de Aceite Toyota Corolla 2020-2023',
    description: 'Filtro de aceite para motor Toyota Corolla 2020-2023',
    costPrice: 25.50,
    listPrice: 35.00,
    brand: 'Toyota',
    model: 'Corolla',
    year: '2020-2023',
    oem: '90915-YZZD4',
    minQuantity: 1,
    leadTime: 7,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD002',
    supplierName: 'Pastillas de Freno Delanteras',
    description: 'Pastillas de freno delanteras para Toyota Corolla',
    costPrice: 85.00,
    listPrice: 120.00,
    brand: 'Toyota',
    model: 'Corolla',
    year: '2018-2023',
    oem: '04465-02340',
    minQuantity: 2,
    leadTime: 10,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD003',
    supplierName: 'Amortiguador Delantero Derecho',
    description: 'Amortiguador delantero derecho para Toyota Corolla',
    costPrice: 150.00,
    listPrice: 220.00,
    brand: 'Toyota',
    model: 'Corolla',
    year: '2019-2023',
    oem: '48510-02B90',
    minQuantity: 1,
    leadTime: 14,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD004',
    supplierName: 'Bujía NGK Iridium',
    description: 'Bujía de iridio NGK para Toyota Corolla',
    costPrice: 45.00,
    listPrice: 65.00,
    brand: 'NGK',
    model: 'Corolla',
    year: '2020-2023',
    oem: 'ILKAR7B11',
    minQuantity: 4,
    leadTime: 5,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD005',
    supplierName: 'Correa de Distribución',
    description: 'Correa de distribución para Toyota Corolla',
    costPrice: 95.00,
    listPrice: 140.00,
    brand: 'Toyota',
    model: 'Corolla',
    year: '2018-2023',
    oem: '13568-39275',
    minQuantity: 1,
    leadTime: 12,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD006',
    supplierName: 'Radiador Nissan Sentra',
    description: 'Radiador completo para Nissan Sentra',
    costPrice: 280.00,
    listPrice: 420.00,
    brand: 'Nissan',
    model: 'Sentra',
    year: '2016-2020',
    oem: '21460-3SH0A',
    minQuantity: 1,
    leadTime: 21,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD007',
    supplierName: 'Batería Moura 12V 60Ah',
    description: 'Batería Moura 12V 60Ah para vehículos',
    costPrice: 180.00,
    listPrice: 260.00,
    brand: 'Moura',
    model: 'Universal',
    year: '2015-2023',
    oem: 'M60GD',
    minQuantity: 1,
    leadTime: 7,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD008',
    supplierName: 'Llanta Aleación 16"',
    description: 'Llanta de aleación 16 pulgadas',
    costPrice: 320.00,
    listPrice: 480.00,
    brand: 'OEM',
    model: 'Universal',
    year: '2018-2023',
    oem: 'WHEEL16AL',
    minQuantity: 1,
    leadTime: 15,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD009',
    supplierName: 'Espejo Retrovisor Izquierdo',
    description: 'Espejo retrovisor lateral izquierdo',
    costPrice: 125.00,
    listPrice: 185.00,
    brand: 'Toyota',
    model: 'Corolla',
    year: '2020-2023',
    oem: '87940-02C70',
    minQuantity: 1,
    leadTime: 10,
    currency: 'ARS'
  },
  {
    supplierCode: 'PROD010',
    supplierName: 'Sensor de Oxígeno',
    description: 'Sensor de oxígeno para Toyota Corolla',
    costPrice: 95.00,
    listPrice: 140.00,
    brand: 'Denso',
    model: 'Corolla',
    year: '2019-2023',
    oem: '89465-02080',
    minQuantity: 1,
    leadTime: 8,
    currency: 'ARS'
  }
];

// Crear el libro de trabajo
const workbook = XLSX.utils.book_new();

// Crear la hoja de trabajo con los datos
const worksheet = XLSX.utils.json_to_sheet(testData);

// Agregar la hoja al libro
XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

// Guardar el archivo
const fileName = 'productos-proveedores-test-correcto.xlsx';
const filePath = path.join(__dirname, fileName);

XLSX.writeFile(workbook, filePath);

console.log(`Archivo Excel creado: ${fileName}`);
console.log('Estructura de datos:');
console.log('- supplierCode: Código del producto');
console.log('- supplierName: Nombre del producto');
console.log('- description: Descripción del producto');
console.log('- costPrice: Precio de costo (número)');
console.log('- listPrice: Precio de lista (número)');
console.log('- brand: Marca');
console.log('- model: Modelo');
console.log('- year: Año');
console.log('- oem: Código OEM');
console.log('- minQuantity: Cantidad mínima (número)');
console.log('- leadTime: Tiempo de entrega en días (número)');
console.log('- currency: Moneda');