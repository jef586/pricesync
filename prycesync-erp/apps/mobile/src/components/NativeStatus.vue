<template>
  <div class="native-status">
    <div v-if="appStore.isNative" class="native-badge">
      <ion-icon name="phone-portrait" />
      <span>App Móvil</span>
    </div>
    <div v-else class="web-badge">
      <ion-icon name="globe" />
      <span>Web</span>
    </div>
    
    <div class="platform-info">
      <small>Plataforma: {{ appStore.platform }}</small>
    </div>
    
    <div class="connectivity-status" :class="{ online: appStore.isOnline, offline: !appStore.isOnline }">
      <ion-icon :name="appStore.isOnline ? 'wifi' : 'wifi-off'" />
      <span>{{ appStore.isOnline ? 'En línea' : 'Sin conexión' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
</script>

<style scoped>
.native-status {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--ps-card);
  border-radius: var(--ps-radius-md);
  box-shadow: var(--ps-shadow-sm);
  margin: 16px;
}

.native-badge, .web-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--ps-radius-sm);
  font-weight: 600;
}

.native-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.web-badge {
  background: #f3e5f5;
  color: #7b1fa2;
}

.platform-info {
  color: var(--ps-text-secondary);
  text-align: center;
}

.connectivity-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--ps-radius-sm);
  font-size: 14px;
  font-weight: 500;
}

.connectivity-status.online {
  background: #e8f5e8;
  color: #2e7d32;
}

.connectivity-status.offline {
  background: #ffebee;
  color: #c62828;
}

ion-icon {
  font-size: 20px;
}
</style>