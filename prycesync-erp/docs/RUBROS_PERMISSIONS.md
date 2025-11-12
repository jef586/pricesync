# Módulo Rubros - Sistema de Permisos

## Descripción

El módulo Rubros (categorías jerárquicas) implementa un sistema de permisos basado en roles (RBAC) con control de acceso multi-empresa. Los usuarios solo pueden acceder a los rubros de su propia empresa, y los permisos están asignados según su rol.

## Permisos Disponibles

| Permiso | Descripción | Grupo |
|---------|-------------|-------|
| `inventory:rubros:create` | Crear nuevos rubros | Inventario |
| `inventory:rubros:read` | Ver y listar rubros | Inventario |
| `inventory:rubros:update` | Editar rubros existentes | Inventario |
| `inventory:rubros:delete` | Eliminar rubros | Inventario |

## Asignación de Permisos por Rol

| Rol | Permisos de Rubros |
|-----|-------------------|
| **SUPERADMIN** | create, read, update, delete |
| **ADMIN** | create, read, update, delete |
| **SUPERVISOR** | create, read, update |
| **SELLER** | read |
| **TECHNICIAN** | read |

## Endpoints de la API

### GET /api/rubros
- **Descripción**: Listar todos los rubros de la empresa del usuario
- **Permiso requerido**: `inventory:rubros:read`
- **Filtros disponibles**:
  - `page`: Número de página (default: 1)
  - `limit`: Elementos por página (default: 20)
  - `search`: Búsqueda por nombre o descripción
  - `parentId`: Filtrar por rubro padre
  - `includeChildren`: Incluir subrubros (true/false)

### GET /api/rubros/search
- **Descripción**: Buscar rubros por texto
- **Permiso requerido**: `inventory:rubros:read`
- **Parámetros**:
  - `q`: Texto a buscar (mínimo 2 caracteres)
  - `limit`: Límite de resultados (default: 10)

### GET /api/rubros/tree
- **Descripción**: Obtener árbol jerárquico de rubros
- **Permiso requerido**: `inventory:rubros:read`
- **Respuesta**: Estructura jerárquica con subrubros anidados

### GET /api/rubros/:id
- **Descripción**: Obtener detalles de un rubro específico
- **Permiso requerido**: `inventory:rubros:read`
- **Respuesta**: Información completa del rubro incluyendo padre e hijos

### POST /api/rubros
- **Descripción**: Crear un nuevo rubro
- **Permiso requerido**: `inventory:rubros:create`
- **Body**:
  ```json
  {
    "name": "Nombre del rubro",
    "description": "Descripción opcional",
    "parentId": "id-del-rubro-padre-o-null"
  }
  ```
- **Validaciones**:
  - El nombre es requerido
  - No puede haber duplicados en el mismo nivel
  - El rubro padre debe existir y pertenecer a la misma empresa

### PUT /api/rubros/:id
- **Descripción**: Actualizar un rubro existente
- **Permiso requerido**: `inventory:rubros:update`
- **Body**: Mismos campos que POST (todos opcionales)
- **Validaciones**:
  - No se puede hacer padre de sí mismo
  - No se pueden crear referencias circulares
  - No puede haber duplicados en el mismo nivel

### DELETE /api/rubros/:id
- **Descripción**: Eliminar un rubro (soft delete)
- **Permiso requerido**: `inventory:rubros:delete`
- **Restricciones**:
  - No se puede eliminar si tiene productos asociados
  - No se puede eliminar si tiene subrubros

## Control Multi-Empresa

Todos los endpoints implementan control multi-empresa:

1. **Filtrado automático**: Los usuarios solo ven rubros de su empresa
2. **Asignación automática**: Al crear un rubro, se asigna automáticamente a la empresa del usuario
3. **Protección cruzada**: No se puede acceder a rubros de otras empresas (404/403)
4. **Excepción SUPERADMIN**: Puede acceder a rubros de cualquier empresa

## Ejemplos de Uso

### Crear un rubro raíz
```bash
curl -X POST http://localhost:3002/api/rubros \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electrónica",
    "description": "Productos electrónicos"
  }'
```

### Crear un subrubro
```bash
curl -X POST http://localhost:3002/api/rubros \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Smartphones",
    "description": "Teléfonos inteligentes",
    "parentId": "id-del-rubro-electrónica"
  }'
```

### Obtener árbol jerárquico
```bash
curl -X GET http://localhost:3002/api/rubros/tree \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Respuestas de Error Comunes

### 401 Unauthorized
```json
{
  "error": "Token de acceso requerido",
  "code": "MISSING_TOKEN"
}
```

### 403 Forbidden
```json
{
  "error": "Permiso denegado",
  "code": "PERMISSION_DENIED",
  "missing": ["inventory:rubros:create"],
  "audit": {
    "userId": "user123",
    "path": "/api/rubros",
    "required": ["inventory:rubros:create"],
    "granted": ["inventory:rubros:read"]
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Rubro no encontrada"
}
```

### 400 Bad Request
```json
{
  "success": false,
  "message": "Ya existe una categoría con ese nombre en este nivel"
}
```

## Testing

### Tests Unitarios
```bash
npm test src/backend/__tests__/permissions.middleware.spec.js
```

### Tests E2E
```bash
npm test tests/e2e/rubros-permissions.spec.js
```

## Implementación Técnica

### Middleware de Autorización
El sistema utiliza el middleware `authorize()` que:
1. Verifica autenticación del usuario
2. Normaliza el rol del usuario
3. Comprueba permisos según la matriz de roles
4. Registra auditoría de accesos denegados

### Control de Empresa
El control multi-empresa se implementa en:
1. **CategoryController**: Todos los métodos filtran por `companyId`
2. **Base de datos**: Índice único `uniq_categories_company_name_parent`
3. **Middleware auth**: Función `sameCompany()` para validación cruzada

### Seed de Permisos
Los permisos se crean automáticamente mediante el seed de Prisma:
```bash
npm run seed
# o
npx prisma db seed
```

## Mantenimiento

### Agregar Nuevos Permisos
1. Agregar al catálogo en `src/backend/middleware/permissions.js`
2. Actualizar la matriz `ROLE_PERMISSIONS`
3. Ejecutar seed para persistir en BD
4. Actualizar documentación

### Modificar Permisos por Rol
1. Actualizar `ROLE_PERMISSIONS` en `permissions.js`
2. Reiniciar el servidor (modo desarrollo)
3. Los cambios se aplican en caliente en producción

## Seguridad

- **JWT**: Tokens con expiración configurada
- **Rate Limiting**: Implementado en endpoints críticos
- **Validación**: Entrada de datos sanitizada
- **Auditoría**: Todos los accesos denegados se registran
- **Principio de menor privilegio**: Roles tienen solo los permisos necesarios