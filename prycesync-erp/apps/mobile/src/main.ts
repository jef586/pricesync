import { createApp } from 'vue'
import { IonicVue } from '@ionic/vue'
import { Capacitor } from '@capacitor/core'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useAppStore } from './stores/app'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css'
import '@ionic/vue/css/structure.css'
import '@ionic/vue/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css'
import '@ionic/vue/css/float-elements.css'
import '@ionic/vue/css/text-alignment.css'
import '@ionic/vue/css/text-transformation.css'
import '@ionic/vue/css/flex-utils.css'
import '@ionic/vue/css/display.css'

/* Theme variables */
import './styles/main.css'

const pinia = createPinia()

const app = createApp(App)
  .use(IonicVue)
  .use(router)
  .use(pinia)

// Initialize app store
const appStore = useAppStore()
appStore.initializeApp()

// Initialize Capacitor
if (Capacitor.isNativePlatform()) {
  console.log('Running on native platform:', Capacitor.getPlatform())
} else {
  console.log('Running on web platform')
}

router.isReady().then(() => {
  app.mount('#app')
})