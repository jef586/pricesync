<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/"></ion-back-button>
        </ion-buttons>
        <ion-title>Iniciar Sesión</ion-title>
      </ion-toolbar>
    </ion-header>
    
    <ion-content class="ion-padding">
      <div class="login-container">
        <div class="logo-section">
          <img src="/assets/logo.svg" alt="PryceSync" class="logo" />
          <h1>PryceSync Mobile</h1>
          <p class="subtitle">App de Ventas</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="login-form">
          <ion-item class="form-item">
            <ion-label position="stacked">Usuario</ion-label>
            <ion-input
              v-model="form.username"
              type="text"
              required
              placeholder="Ingrese su usuario"
            ></ion-input>
          </ion-item>
          
          <ion-item class="form-item">
            <ion-label position="stacked">Contraseña</ion-label>
            <ion-input
              v-model="form.password"
              type="password"
              required
              placeholder="Ingrese su contraseña"
            ></ion-input>
          </ion-item>
          
          <ion-button
            type="submit"
            expand="block"
            class="login-button"
            :disabled="loading"
          >
            <ion-spinner v-if="loading" name="crescent"></ion-spinner>
            <span v-else>Iniciar Sesión</span>
          </ion-button>
        </form>
        
        <div v-if="error" class="error-message">
          <ion-text color="danger">{{ error }}</ion-text>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner
} from '@ionic/vue'

const router = useRouter()
const form = ref({
  username: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  loading.value = true
  error.value = ''
  
  try {
    // TODO: Implement actual login logic
    console.log('Login attempt:', form.value)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Navigate to dashboard on success
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Error al iniciar sesión. Por favor, intente nuevamente.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  max-width: 400px;
  margin: 0 auto;
}

.logo-section {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 80px;
  height: 80px;
  margin-bottom: 1rem;
}

.logo-section h1 {
  color: var(--ps-primary);
  margin: 0;
  font-size: 1.5rem;
}

.subtitle {
  color: var(--ps-text-secondary);
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
}

.login-form {
  width: 100%;
}

.form-item {
  margin-bottom: 1rem;
  --background: var(--ps-input-bg);
  --color: var(--ps-text-primary);
}

.login-button {
  margin-top: 1.5rem;
  --background: var(--ps-primary);
}

.error-message {
  text-align: center;
  margin-top: 1rem;
  padding: 0.5rem;
  background: rgba(var(--ion-color-danger-rgb), 0.1);
  border-radius: var(--ps-radius-sm);
}
</style>