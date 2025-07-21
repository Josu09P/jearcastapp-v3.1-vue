import { createApp } from 'vue'
import App from './App.vue'
import { createPinia } from 'pinia'
import { router } from './router'

// Global CSS
import '@/assets/global.css'
import '@/assets/vars.css'
// Bootstrap (CSS y JS)
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Toastify (solo CSS, los toasts se usan en componentes)
import 'toastify-js/src/toastify.css'

// Pinia
import { useUserStore } from './stores/user'
import { useTheme } from './utils/userTheme'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// CARGAR TEMA
const { loadTheme } = useTheme()
loadTheme()
// Cargar usuario desde localStorage
const userStore = useUserStore()
userStore.loadUserFromLocalStorage()

app.mount('#app')
