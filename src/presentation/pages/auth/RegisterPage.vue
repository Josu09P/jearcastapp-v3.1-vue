<template>
  <div
    class="d-flex align-items-center justify-content-center auth-register">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-sm text-white">
            <div class="card-body">
              <h3 class="card-title text-center mb-4">
                <img
                  src="@/assets/img/logo-v3.png"
                  alt="Logo"
                  width="80"
                  style="filter: brightness(0) invert(1); margin-bottom: 10px;"
                />
                <br />
                Crear cuenta
              </h3>
              <form @submit.prevent="handleSubmit">
                <div class="mb-3">
                  <label for="name" class="form-label">Nombre completo</label>
                  <input
                    v-model="form.name"
                    type="text"
                    class="form-control"
                    placeholder="Ingresa tu nombre"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Correo electrónico</label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="form-control"
                    placeholder="Correo asociado a Google"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input
                    v-model="form.password"
                    type="password"
                    class="form-control"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Confirmar contraseña</label>
                  <input
                    v-model="form.confirmPassword"
                    type="password"
                    class="form-control"
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="apikeyYoutube" class="form-label">API Key de YouTube</label>
                  <input
                    v-model="form.apikeyYoutube"
                    type="text"
                    class="form-control"
                    placeholder="Tu API Key de YouTube"
                  />
                  <div class="form-text text-light">
                    Esta clave será usada para realizar búsquedas de videos.
                  </div>
                </div>

                <div class="d-grid gap-2">
                  <button :disabled="loading" type="submit" class="btn btn-primary">
                    {{ loading ? 'Registrando...' : 'Registrarme' }}
                  </button>
                </div>
              </form>

              <div class="text-center mt-3">
                ¿Ya tienes una cuenta?
                <router-link to="/auth/login" class="text-primary">Inicia sesión aquí</router-link>
              </div>
              <p v-if="errorMessage" class="text-danger text-center mt-2">
                {{ errorMessage }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerUser } from '@/domain/usecases/auth/RegisterUser'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

const router = useRouter()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  apikeyYoutube: ''
})

// Validar API Key de YouTube
async function isYoutubeApiKeyValid(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=prueba&type=video&maxResults=1&key=${apiKey}`
    )
    const data = await res.json()
    return !data.error
  } catch (e) {
    return false
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''
  loading.value = true

  Toastify({
    text: '🔍 Verificando datos... Probando API Key de YouTube',
    duration: 3000,
    style: { background: '#0d6efd' }
  }).showToast()

  await new Promise((resolve) => setTimeout(resolve, 500))

  const validApiKey = await isYoutubeApiKeyValid(form.apikeyYoutube)

  if (!validApiKey) {
    Toastify({
      text: '❌ La API Key de YouTube no es válida.',
      duration: 4000,
      style: { background: '#dc3545' }
    }).showToast()
    loading.value = false
    return
  }

  try {
    await registerUser(form)

    Toastify({
      text: '✅ Registro exitoso. ¡Bienvenido!',
      duration: 3000,
      style: {
        background: 'linear-gradient(to right, #00b09b, #96c93d)'
      }
    }).showToast()

    setTimeout(() => router.push('/auth/login'), 2000)
  } catch (error: any) {
    Toastify({
      text: error.message || 'Error al registrar',
      duration: 4000,
      style: { background: '#e63946' }
    }).showToast()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-register {
  min-height: 100vh;
  background-image: url("@/assets/img/bg-hero.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #102c4a;
}
.card {
  padding: 20px;
  background-color: #5c616544;
  border-radius: 1rem;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
</style>
