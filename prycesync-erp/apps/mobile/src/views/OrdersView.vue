<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Nuevo Pedido</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="icon-only" name="checkmark-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="order-container">
        <div class="customer-section">
          <ion-item>
            <ion-label position="stacked">Cliente</ion-label>
            <ion-select placeholder="Seleccionar cliente">
              <ion-select-option value="1">Juan Pérez</ion-select-option>
              <ion-select-option value="2">María García</ion-select-option>
            </ion-select>
          </ion-item>
        </div>
        
        <div class="products-section">
          <h3>Productos</h3>
          
          <ion-list>
            <ion-item v-for="item in orderItems" :key="item.id" class="order-item">
              <ion-label>
                <h4>{{ item.product }}</h4>
                <p>Cantidad: {{ item.quantity }} - Precio: ${{ item.price }}</p>
              </ion-label>
              <ion-note slot="end">${{ (item.quantity * item.price).toFixed(2) }}</ion-note>
            </ion-item>
          </ion-list>
          
          <ion-button expand="block" fill="outline" @click="addProduct">
            <ion-icon slot="start" name="add-outline"></ion-icon>
            Agregar Producto
          </ion-button>
        </div>
        
        <div class="total-section">
          <ion-item lines="none">
            <ion-label>
              <h2>Total</h2>
            </ion-label>
            <ion-note slot="end" class="total-amount">${{ total.toFixed(2) }}</ion-note>
          </ion-item>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonList,
  IonNote
} from '@ionic/vue'

interface OrderItem {
  id: number
  product: string
  quantity: number
  price: number
}

const orderItems = ref<OrderItem[]>([
  {
    id: 1,
    product: 'Producto A',
    quantity: 2,
    price: 150.00
  },
  {
    id: 2,
    product: 'Producto B',
    quantity: 1,
    price: 200.00
  }
])

const total = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + (item.quantity * item.price), 0)
})

const addProduct = () => {
  // TODO: Implement add product logic
  console.log('Add product')
}
</script>

<style scoped>
.order-container {
  max-width: 600px;
  margin: 0 auto;
}

.customer-section {
  margin-bottom: 1.5rem;
}

.products-section {
  margin-bottom: 1.5rem;
}

.products-section h3 {
  margin-bottom: 1rem;
  color: var(--ps-text-primary);
}

.order-item {
  --background: var(--ps-card);
  margin-bottom: 0.5rem;
}

.total-section {
  border-top: 1px solid var(--ps-border);
  padding-top: 1rem;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--ps-primary);
}
</style>