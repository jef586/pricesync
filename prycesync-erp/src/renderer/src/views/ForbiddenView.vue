<template>
  <DashboardLayout>
    <div class="forbidden-view">
      <PageHeader title="Acceso denegado" subtitle="No tienes permisos para ver esta página" />

      <div class="content">
        <div class="card">
          <div class="icon">🚫</div>
          <h2>403 - Permiso requerido</h2>
          <p>
            Tu usuario no posee los permisos necesarios para acceder a este recurso.
            Si crees que es un error, contacta a un administrador.
          </p>
          <div class="actions">
            <router-link to="/dashboard" class="btn">Ir al Dashboard</router-link>
          </div>
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
.forbidden-view {
  padding: 1rem;
}
.content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 1rem;
}
.card {
  background: var(--ps-card);
  border: 1px solid var(--ps-border);
  border-radius: 12px;
  padding: 2rem;
  max-width: 560px;
  text-align: center;
}
.icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
.btn {
  display: inline-block;
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: var(--ps-primary);
  color: white;
  text-decoration: none;
}
</style>