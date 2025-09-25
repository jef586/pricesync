<template>
  <DashboardLayout>
    <div class="invoice-new-view">
      <div class="page-header">
        <div class="header-left">
          <router-link to="/invoices" class="back-button">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Volver
          </router-link>
          <h1>Nueva Factura</h1>
        </div>
      </div>

      <div class="content-placeholder">
        <div class="placeholder-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2>Crear Nueva Factura</h2>
        <p>Esta funcionalidad estará disponible próximamente.</p>
        <p>Aquí podrás crear facturas con todos los detalles necesarios para tu empresa.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import DashboardLayout from '../components/organisms/DashboardLayout.vue'
</script>

<style scoped>
.invoice-new-view {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  text-decoration: none;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.back-button:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.back-button svg {
  width: 20px;
  height: 20px;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.content-placeholder {
  background: white;
  border-radius: 0.75rem;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
}

.placeholder-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 2rem;
  color: #9ca3af;
}

.placeholder-icon svg {
  width: 100%;
  height: 100%;
}

.content-placeholder h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
}

.content-placeholder p {
  color: #6b7280;
  margin-bottom: 0.5rem;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}
</style>