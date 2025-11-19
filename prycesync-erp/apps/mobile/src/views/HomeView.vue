<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>PryceSync Mobile</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <NativeStatus />
      
      <div class="welcome-container">
        <h1>Bienvenido a PryceSync Mobile</h1>
        <p>App móvil para vendedores y preventistas</p>
        
        <ion-button expand="block" router-link="/login">
          Iniciar Sesión
        </ion-button>
        
        <div class="feature-grid">
          <div class="feature-card">
            <div class="icon-placeholder">🛒</div>
            <h3>Gestión de Pedidos</h3>
            <p>Carga y gestión de pedidos en ruta</p>
          </div>
          
          <div class="feature-card">
            <div class="icon-placeholder">👥</div>
            <h3>Clientes</h3>
            <p>Administración de clientes y visitas</p>
          </div>
          
          <div class="feature-card">
            <div class="icon-placeholder">📦</div>
            <h3>Artículos</h3>
            <p>Catálogo de productos y stock</p>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton
} from '@ionic/vue'
import NativeStatus from '@/components/NativeStatus.vue'
</script>

<style scoped>
.welcome-container {
  text-align: center;
  padding: 20px;
}

.welcome-container h1 {
  color: #0066cc;
  margin-bottom: 10px;
}

.welcome-container p {
  color: #666;
  margin-bottom: 30px;
}

.feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 15px;
  margin-top: 30px;
}

.feature-card {
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.feature-card .icon-placeholder {
  font-size: 2rem;
  margin-bottom: 10px;
}

.feature-card h3 {
  margin: 10px 0;
  color: #333;
}

.feature-card p {
  color: #666;
  font-size: 14px;
  margin: 0;
}

@media (min-width: 768px) {
  .feature-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>