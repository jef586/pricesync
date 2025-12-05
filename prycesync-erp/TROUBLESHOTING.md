# BUG-ART-EDIT-500

## Resumen

- Síntoma: Error 500 al editar artículo (`PUT /api/articles/:id`) con payloads válidos.
- Causa raíz: Referencia a variable inexistente `componentsProvided` dentro de la transacción en `updateArticle`, provocando `ReferenceError` y `ROLLBACK`.
- Fix: Declarar y usar flag de presencia de componentes (`hasIncomingComponents`) y validar payload con Zod, además de manejo de errores específico.

## Cambios aplicados

- `src/backend/controllers/ArticleController.js`: se agrega `hasIncomingComponents` y se usa en sincronización de componentes; ajustes de códigos y mensajes de error; auditoría.
- `src/backend/middleware/articlesValidation.js`: nueva validación Zod para `PUT /api/articles/:id`.
- `src/backend/routes/articles.js`: se añade `validateUpdateArticle` al `PUT`.
- Tests: se actualizan y amplían casos en `src/backend/__tests__/articles.crud.spec.js`.

## Verificación

1. Levantar Docker: `docker-compose up -d`
2. Revisar logs: `docker-compose logs -f app`
3. Login (semilla por defecto puede variar; usar credenciales válidas del entorno) y ejecutar `PUT` con el payload del bug.
4. Esperado: `200 OK` con artículo actualizado, o errores 4xx (400/409/422) con `code` y `message` claros.

## Observabilidad

- Se agrega registro en `AuditService.log` con `actionType=ARTICLE_UPDATE`, `payloadDiff`, `request meta`.

## Notas

- No se cambia el contrato público de lectura/listado.
- El endpoint evita 500 salvo fallas no controladas.

