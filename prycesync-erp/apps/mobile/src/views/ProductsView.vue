<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Productos</ion-title>
        <ion-buttons slot="end">
          <ion-button>
            <ion-icon slot="icon-only" name="search-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="products-container">
        <div class="products-grid">
          <ion-card v-for="product in products" :key="product.id" class="product-card">
            <img :src="product.image" :alt="product.name" class="product-image" />
            <ion-card-header>
              <ion-card-title>{{ product.name }}</ion-card-title>
              <ion-card-subtitle>Código: {{ product.code }}</ion-card-subtitle>
            </ion-card-header>
            <ion-card-content>
              <div class="product-info">
                <p class="price">${{ product.price }}</p>
                <p class="stock" :class="{ 'low-stock': product.stock < 10 }">
                  Stock: {{ product.stock }}
                </p>
              </div>
              <ion-button expand="block" size="small">
                Agregar al Pedido
              </ion-button>
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
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent
} from '@ionic/vue'

interface Product {
  id: number
  name: string
  code: string
  price: number
  stock: number
  image: string
}

const products = ref<Product[]>([
  {
    id: 1,
    name: 'Producto A',
    code: 'PROD001',
    price: 150.00,
    stock: 25,
    image: 'https://via.placeholder.com/150'
  },
  {
    id: 2,
    name: 'Producto B',
    code: 'PROD002',
    price: 200.00,
    stock: 8,
    image: 'https://via.placeholder.com/150'
  },
  {
    id: 3,
    name: 'Producto C',
    code: 'PROD003',
    price: 75.00,
    stock: 50,
    image: 'https://via.placeholder.com/150'
  }
])
</script>

<style scoped>
.products-container {
  max-width: 600px;
  margin: 0 auto;
}

.products-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.product-card {
  --background: var(--ps-card);
  margin: 0;
}

.product-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.product-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.2rem;
  font-weight: bold;
  color: var(--ps-primary);
  margin: 0;
}

.stock {
  margin: 0;
  font-size: 0.9rem;
}

.low-stock {
  color: var(--ps-error);
}

@media (min-width: 768px) {
  .products-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>