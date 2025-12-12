<template>
  <DashboardLayout :contentScrollable="true" :key="$route.fullPath">
    <div class="help-view">
      <PageHeader
        title="Centro de Ayuda"
        subtitle="Guía de funcionalidades y configuración del sistema"
      />

      <div class="help-view-scroll">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Contenido principal -->
        <div class="lg:col-span-2 bg-slate-900 text-white rounded-lg shadow p-6 space-y-8 border border-slate-700">
          <section>
            <h2 class="text-xl font-semibold text-white">Visión General</h2>
            <p class="mt-2 text-slate-300">
              Punto de Venta 2026 reúne en un solo lugar la gestión de Facturación, Clientes, Inventario, Productos, Proveedores y Configuración de Empresa. Esta guía explica de forma clara y práctica cómo usar las funciones principales, con indicaciones paso a paso para que puedas trabajar sin tecnicismos.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Configuración de Precios (Pricing)</h2>
            <ol class="mt-2 list-decimal list-inside text-slate-300 space-y-2">
              <li>Desde el menú lateral, abre <strong>Configuración</strong> y luego <strong>Precios</strong>.</li>
              <li>Define el <em>Margen por defecto</em> y la <em>Fuente de precio</em> (Costo o Precio de Lista).</li>
              <li>Configura el <em>Redondeo</em> y la cantidad de <em>Decimales</em> según tu política comercial.</li>
              <li>Si trabajas con distintos proveedores, agrega <em>Márgenes específicos por proveedor</em> (overrides).</li>
              <li>Utiliza el <em>Preview</em> para simular precios con un costo y precio de lista, y confirma que el resultado es el esperado.</li>
              <li>Guarda los cambios para que se apliquen en el cálculo de precios del sistema.</li>
            </ol>
            <p class="mt-2 text-slate-300">
              Consejo: el <em>Preview</em> te ayuda a validar rápidamente tus reglas antes de aplicarlas a todos los productos.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Importación de Productos de Proveedores</h2>
            <ol class="mt-2 list-decimal list-inside text-slate-300 space-y-2">
              <li>En el menú lateral, entra a <strong>Proveedores</strong> y selecciona el proveedor.</li>
              <li>En el detalle del proveedor, usa la opción <em>Importar productos</em>.</li>
              <li>Sube el archivo del proveedor (por ejemplo Excel/CSV) con código, nombre, costo y precio lista.</li>
              <li>Revisa el resumen y confirma la importación. Si tienes márgenes por proveedor configurados, se aplicarán al calcular precios.</li>
            </ol>
            <p class="mt-2 text-slate-300">
              Consejo: valida que las columnas del archivo coincidan con tu formato de trabajo para evitar errores de carga.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Gestión de Inventario</h2>
            <ul class="mt-2 list-disc list-inside text-slate-300 space-y-1">
              <li>Desde la barra lateral, abre <strong>Inventario</strong> para ver todos tus artículos.</li>
              <li>Usa la búsqueda y filtros para encontrar rápidamente productos por nombre, categoría o proveedor.</li>
              <li>Edita productos para ajustar stock, precios, imágenes y datos generales.</li>
              <li>Consulta precios calculados según tus reglas de pricing.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Facturación</h2>
            <ul class="mt-2 list-disc list-inside text-slate-300 space-y-1">
              <li>Para iniciar una venta rápida, usa el acceso <strong>Nueva venta</strong> del menú lateral.</li>
              <li>Agrega cliente, selecciona artículos, aplica descuentos si corresponde y elige el medio de pago.</li>
              <li>Imprime el comprobante según tu configuración de impresión.</li>
              <li>Consulta el historial en <strong>Facturas</strong> para ver y editar comprobantes.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Gestión de Clientes</h2>
            <ul class="mt-2 list-disc list-inside text-slate-300 space-y-1">
              <li>Abre <strong>Clientes</strong> desde el menú lateral para crear, editar y buscar clientes.</li>
              <li>Guarda datos esenciales: información fiscal, contactos y condiciones comerciales.</li>
              <li>Usa la búsqueda para localizar clientes rápidamente por nombre o documento.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Configuración de Empresa</h2>
            <ul class="mt-2 list-disc list-inside text-slate-300 space-y-1">
              <li>En el menú lateral, abre <strong>Configuración</strong> para gestionar datos de tu empresa.</li>
              <li>Dentro de Configuración, entra a <strong>Impresión</strong> para definir formatos y opciones de ticket.</li>
              <li>Dentro de Configuración, entra a <strong>Precios</strong> para establecer tu política comercial.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Navegación General</h2>
            <ul class="mt-2 list-disc list-inside text-slate-300 space-y-1">
              <li><strong>Inicio</strong>: Accesos rápidos y estado general.</li>
              <li><strong>Dashboard</strong>: KPIs y análisis del negocio.</li>
              <li><strong>Inventario</strong>: Lista y detalle de productos.</li>
              <li><strong>Proveedores</strong>: Gestión de proveedores y sus listas.</li>
              <li><strong>Clientes</strong>: Altas y edición de clientes.</li>
              <li><strong>Nueva venta</strong>: Punto de venta.</li>
              <li><strong>Facturas</strong>: Historial y administración de comprobantes.</li>
              <li><strong>Configuración</strong> → <strong>Precios</strong>: Reglas de pricing.</li>
              <li><strong>Configuración</strong> → <strong>Impresión</strong>: Opciones de ticket.</li>
              <li><strong>Ayuda</strong>: Esta guía.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Tips de uso</h2>
            <ul class="mt-2 list-disc list-inside text-slate-300 space-y-1">
              <li>Utiliza la barra lateral para moverte rápidamente entre módulos.</li>
              <li>Antes de vender, verifica tus reglas de pricing en el <em>Preview</em>.</li>
              <li>Mantén tus proveedores y clientes actualizados para agilizar búsquedas.</li>
              <li>Después de importar productos, revisa una muestra para confirmar precios y stock.</li>
              <li>Si algo no luce bien, alterna entre modo claro/oscuro desde el control del tema.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-white">Acceso a documentación técnica (opcional)</h2>
            <p class="mt-2 text-slate-300">
              Si necesitas más detalle, puedes consultar los documentos técnicos del proyecto en la carpeta <code>docs/</code> del repositorio. Esta sección es opcional y sólo necesaria para configuraciones avanzadas.
            </p>
          </section>
        </div>

        <!-- Panel lateral: recursos y enlaces -->
        <aside class="bg-slate-900 text-white rounded-lg shadow p-6 space-y-4 border border-slate-700">
          <h3 class="text-lg font-medium text-white">Recursos</h3>
          <ul class="space-y-2 text-blue-400">
            <li>
              <a href="/company/pricing" class="hover:underline">Ir a Configuración de Pricing</a>
            </li>
            <li>
              <a href="/suppliers" class="hover:underline">Ver Proveedores</a>
            </li>
            <li>
              <a href="/inventory" class="hover:underline">Ver Inventario</a>
            </li>
            <li>
              <a href="/invoices" class="hover:underline">Ver Facturas</a>
            </li>
          </ul>
          <div class="mt-4 text-sm text-slate-300">
            Para documentación extensa, consulta los archivos en <code>docs/</code> del repositorio.
          </div>
        </aside>
      </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '@/components/organisms/DashboardLayout.vue'
import PageHeader from '@/components/molecules/PageHeader.vue'
</script>

<style scoped>
.help-view {
  @apply space-y-6;
}
.help-view-scroll { min-height: 0; overflow-y: auto; flex: 1; padding-bottom: 1rem; display: flex; flex-direction: column; }
:deep(.dashboard-content) { padding-right: 0; }
:deep(.help-view-scroll) { scrollbar-width: thin; scrollbar-color: var(--ps-border) transparent; }
:deep(.help-view-scroll::-webkit-scrollbar) { width: 10px; height: 10px; }
:deep(.help-view-scroll::-webkit-scrollbar-track) { background: transparent; }
:deep(.help-view-scroll::-webkit-scrollbar-thumb) { background-color: color-mix(in srgb, var(--ps-border) 70%, transparent); border-radius: 8px; border: 2px solid var(--ps-bg); }
:deep(.help-view-scroll::-webkit-scrollbar-thumb:hover) { background-color: color-mix(in srgb, var(--ps-primary) 50%, var(--ps-border) 50%); }
</style>
