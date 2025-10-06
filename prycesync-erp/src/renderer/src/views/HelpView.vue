<template>
  <DashboardLayout>
    <div class="help-view">
      <PageHeader
        title="Centro de Ayuda"
        subtitle="Guía de funcionalidades y configuración del sistema"
      />

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Contenido principal -->
        <div class="lg:col-span-2 bg-white rounded-lg shadow p-6 space-y-8">
          <section>
            <h2 class="text-xl font-semibold text-gray-900">Visión General</h2>
            <p class="mt-2 text-gray-600">
              PryceSync ERP integra módulos de Facturación, Clientes, Inventario, Productos y Proveedores
              con reglas de pricing configurables y redondeo. Esta guía resume cómo navegar y configurar
              las funcionalidades principales, e incluye pasos prácticos para el pricing y la importación
              de productos.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">Configuración de Pricing y Preview</h2>
            <ol class="mt-2 list-decimal list-inside text-gray-700 space-y-2">
              <li>Navega a <code>/company/pricing</code>.</li>
              <li>Ajusta <em>Margen por defecto</em>, <em>Fuente de precio</em> (Costo o Precio Lista), <em>Redondeo</em> y <em>Decimales</em>.</li>
              <li>Define <em>Overrides por proveedor</em> con márgenes específicos.</li>
              <li>Usa el <em>Preview</em> seleccionando proveedor (opcional) e ingresando Costo y Precio Lista.</li>
              <li>Guarda para persistir los cambios; los overrides se reflejan en el preview y en cálculos futuros.</li>
            </ol>
            <p class="mt-2 text-gray-600">
              Lógica de cálculo en frontend: <code>settingsService.computePreviewSale</code>.
              En backend: <code>PricingService.computeSalePrice</code> aplica overrides si se pasa <code>supplierId</code>.
            </p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">Importación de Productos de Proveedores</h2>
            <ol class="mt-2 list-decimal list-inside text-gray-700 space-y-2">
              <li>Ve a Detalle de Proveedor (<code>/suppliers/:id</code>).</li>
              <li>Abre el modal de importación y carga el Excel con los productos.</li>
              <li>El sistema puede aplicar pricing durante la importación si está habilitado.</li>
              <li>Objetivo recomendado: pasar <code>supplierId</code> al cálculo para que se apliquen los overrides.</li>
            </ol>
            <p class="mt-2 text-gray-600">Endpoints relacionados: <code>/suppliers/import/execute</code> y <code>/:id/products/import/execute</code>.</p>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">Navegación y Rutas</h2>
            <ul class="mt-2 list-disc list-inside text-gray-700 space-y-1">
              <li><code>/dashboard</code>: Resumen y accesos rápidos.</li>
              <li><code>/invoices</code>: Lista y gestión de facturas.</li>
              <li><code>/customers</code>: Gestión de clientes.</li>
              <li><code>/inventory</code>: Inventario y navegación a productos.</li>
              <li><code>/suppliers</code>: Proveedores y productos asociados.</li>
              <li><code>/company</code>: Información de empresa.</li>
              <li><code>/company/pricing</code>: Configuración de pricing.</li>
              <li><code>/help</code>: Esta guía.</li>
            </ul>
          </section>

          <section>
            <h2 class="text-xl font-semibold text-gray-900">Autenticación</h2>
            <p class="mt-2 text-gray-600">
              El guard del router exige autenticación en las rutas con <code>meta.requiresAuth</code> y redirige a
              <code>/auth</code> si la sesión no está iniciada. Tras login exitoso, navega al Dashboard.
            </p>
          </section>
        </div>

        <!-- Panel lateral: recursos y enlaces -->
        <aside class="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 class="text-lg font-medium text-gray-900">Recursos</h3>
          <ul class="space-y-2 text-blue-600">
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
          <div class="mt-4 text-sm text-gray-600">
            Para documentación extensa, consulta los archivos en <code>docs/</code> del repositorio.
          </div>
        </aside>
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
</style>