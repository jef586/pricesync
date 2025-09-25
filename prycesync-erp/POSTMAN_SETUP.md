# 📮 Guía de Configuración de Postman para PryceSync ERP API

## 🚀 Configuración Inicial

### 1. Importar Archivos
1. **Colección**: Importa `PryceSync-ERP-API.postman_collection.json`
2. **Entorno**: Importa `PryceSync-ERP.postman_environment.json`
3. **Seleccionar Entorno**: Asegúrate de seleccionar "PryceSync ERP - Local" en el dropdown de entornos

### 2. Variables de Entorno Configuradas
- `base_url`: http://localhost:3002
- `auth_token`: Se establece automáticamente después del login
- `invoice_id`: Se establece automáticamente al crear facturas
- `company_id`: cmfzbx1ff0000521dfh4ynxm1 (ID de la empresa de prueba)
- `test_email`: admin@empresatest.com
- `test_password`: admin123

## 🔐 Datos de Prueba Disponibles

### Empresa de Prueba
- **Nombre**: Empresa Test S.A.
- **Tax ID**: 20-12345678-9
- **Email**: admin@empresatest.com
- **ID**: cmfzbx1ff0000521dfh4ynxm1

### Usuario Administrador
- **Email**: admin@empresatest.com
- **Password**: admin123
- **Nombre**: Admin Test
- **Rol**: admin

## 📋 Flujo de Pruebas Recomendado

### 1. Verificación Inicial
```
🏥 Health & Status
├── Health Check (Verificar que la API esté funcionando)
```

### 2. Autenticación Completa
```
🔐 Authentication
├── Register User (Crear usuario - opcional, ya existe uno)
├── Login (Obtener token de acceso)
├── Get Current User (Verificar autenticación)
└── Logout (Cerrar sesión)
```

### 3. Gestión de Facturas
```
🧾 Invoices
├── Get All Invoices (Listar facturas)
├── Create Invoice (Crear nueva factura)
├── Get Invoice by ID (Obtener factura específica)
├── Update Invoice (Actualizar factura)
└── Delete Invoice (Eliminar factura)
```

### 4. Información de Empresa
```
🏢 Companies
└── Get Company Info (Obtener datos de la empresa)
```

### 5. Casos de Error
```
❌ Error Cases
├── Access Without Token (Verificar protección)
└── Invalid Login (Verificar validaciones)
```

## 🔧 Funcionalidades Automáticas

### Gestión Automática de Tokens
- **Login**: El token se guarda automáticamente en `{{auth_token}}`
- **Requests Protegidos**: Usan automáticamente el token guardado
- **Logout**: Limpia automáticamente el token

### Variables Dinámicas
- **invoice_id**: Se establece automáticamente al crear facturas
- **Validaciones**: Cada request incluye tests automáticos

## 📊 Tests Automáticos Incluidos

Cada endpoint incluye tests que verifican:
- ✅ Códigos de estado HTTP correctos
- ✅ Estructura de respuesta esperada
- ✅ Datos requeridos en las respuestas
- ✅ Manejo correcto de errores

## 🎯 Ejemplos de Uso

### Crear una Factura
```json
{
  "clientName": "Cliente Test S.A.",
  "clientEmail": "cliente@test.com",
  "clientTaxId": "20-87654321-0",
  "clientAddress": "Av. Santa Fe 1234",
  "items": [
    {
      "description": "Servicio de Consultoría",
      "quantity": 10,
      "unitPrice": 5000,
      "taxRate": 21
    }
  ],
  "notes": "Factura de prueba"
}
```

### Login
```json
{
  "email": "admin@empresatest.com",
  "password": "admin123"
}
```

## 🚨 Solución de Problemas

### Error: "Token de acceso requerido"
- **Causa**: No has hecho login o el token expiró
- **Solución**: Ejecuta el endpoint "Login" primero

### Error: "Empresa no encontrada"
- **Causa**: El companyId no es válido
- **Solución**: Usa el ID: `cmfzbx1ff0000521dfh4ynxm1`

### Error: "Credenciales inválidas"
- **Causa**: Email o password incorrectos
- **Solución**: Usa `admin@empresatest.com` / `admin123`

## 📈 Monitoreo y Logs

Para ver logs detallados del backend:
```bash
docker-compose logs -f app
```

## 🔄 Reiniciar Datos de Prueba

Si necesitas recrear los datos de prueba:
```bash
docker exec prycesync-erp-app-1 node create-test-company.js
```

## 📝 Notas Importantes

1. **Entorno Local**: Esta configuración es solo para desarrollo local
2. **Datos de Prueba**: No uses estos datos en producción
3. **Tokens**: Los tokens expiran, haz login nuevamente si es necesario
4. **Base de Datos**: Los datos se mantienen mientras Docker esté corriendo

¡Listo para probar tu API! 🚀