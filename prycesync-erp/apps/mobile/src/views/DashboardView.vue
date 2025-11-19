<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="logout">
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="dashboard-container">
        <h1>Bienvenido, Vendedor</h1>
        <p class="subtitle">Gestión de ventas móvil</p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <ion-icon name="calendar-outline"></ion-icon>
            <div class="stat-info">
              <h3>Visitas Hoy</h3>
              <p class="stat-number">12</p>
            </div>
          </div>
          
          <div class="stat-card">
            <ion-icon name="cart-outline"></ion-icon>
            <div class="stat-info">
              <h3>Pedidos Hoy</h3>
              <p class="stat-number">8</p>
            </div>
          </div>
          
          <div class="stat-card">
            <ion-icon name="cash-outline"></ion-icon>
            <div class="stat-info">
              <h3>Ventas Hoy</h3>
              <p class="stat-number">$45,230</p>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div class="action-grid">
            <ion-button expand="block" router-link="/customers" class="action-button">
              <ion-icon slot="start" name="people-outline"></ion-icon>
              Clientes
            </ion-button>
            
            <ion-button expand="block" router-link="/products" class="action-button">
              <ion-icon slot="start" name="cube-outline"></ion-icon>
              Productos
            </ion-button>
            
            <ion-button expand="block" router-link="/orders" class="action-button">
              <ion-icon slot="start" name="document-text-outline"></ion-icon>
              Nuevo Pedido
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonButton,
  IonIcon
} from '@ionic/vue'

const router = useRouter()

const logout = () => {
  // TODO: Implement logout logic
  router.push('/login')
}
</script>

<style scoped>
.dashboard-container {
  max-width: 600px;
  margin: 0 auto;
}

.dashboard-container h1 {
  color: var(--ps-primary);
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--ps-text-secondary);
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--ps-card);
  border-radius: var(--ps-radius-md);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--ps-shadow-sm);
}

.stat-card ion-icon {
  font-size: 2rem;
  color: var(--ps-primary);
}

.stat-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--ps-text-secondary);
  font-size: 0.9rem;
  font-weight: var(--ps-weight-medium);
}

.stat-number {
  margin: 0;
  color: var(--ps-text-primary);
  font-size: 1.5rem;
  font-weight: var(--ps-weight-bold);
}

.quick-actions h2 {
  margin-bottom: 1rem;
  color: var(--ps-text-primary);
}

.action-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.action-button {
  --background: var(--ps-primary);
  margin: 0;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .action-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>