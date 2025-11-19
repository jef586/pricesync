<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Clientes</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="icon-only" name="add-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="customers-container">
        <div class="search-section">
          <ion-searchbar placeholder="Buscar clientes..."></ion-searchbar>
        </div>
        
        <div class="customers-list">
          <ion-card v-for="customer in customers" :key="customer.id" class="customer-card">
            <ion-card-header>
              <ion-card-title>{{ customer.name }}</ion-card-title>
              <ion-card-subtitle>{{ customer.cuit }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <p>{{ customer.address }}</p>
              <p>{{ customer.phone }}</p>
            </ion-card-content>
          </ion-card>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonSearchbar,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/vue'

interface Customer {
  id: number
  name: string
  cuit: string
  address: string
  phone: string
}

const customers = ref<Customer[]>([
  {
    id: 1,
    name: 'Juan Pérez',
    cuit: '20-12345678-9',
    address: 'Calle Principal 123',
    phone: '11-1234-5678'
  },
  {
    id: 2,
    name: 'María García',
    cuit: '27-87654321-0',
    address: 'Avenida Central 456',
    phone: '11-8765-4321'
  }
])
</script>

<style scoped>
.customers-container {
  max-width: 600px;
  margin: 0 auto;
}

.search-section {
  margin-bottom: 1rem;
}

.customers-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.customer-card {
  --background: var(--ps-card);
  margin: 0;
}
</style>