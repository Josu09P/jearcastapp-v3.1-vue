<template>
  <div class="d-flex align-items-center justify-content-center auth-login">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-5">
          <div class="card shadow-sm text-white">
            <div class="card-body">
              <h2 class="card-title text-center mb-4">
                <img src="@/assets/img/logo-v3.png" alt="Logo" width="80"
                  style="filter: brightness(0) invert(1); margin-bottom: 10px;" />
                <br />
                Iniciar sesión
              </h2>
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="email" class="form-label">Correo electrónico</label>
                  <input v-model="form.email" type="email" class="form-control" placeholder="Tu correo" required />
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input v-model="form.password" type="password" class="form-control" placeholder="Tu contraseña"
                    required />
                </div>
                <div class="d-grid gap-2">
                  <button :disabled="loading" class="btn btn-primary" type="submit">
                    {{ loading ? 'Ingresando...' : 'Iniciar sesión' }}
                  </button>
                </div>
              </form>

              <div class="text-center mt-3">
                ¿No tienes una cuenta de JearCast?<br>
                <router-link to="/auth/register" class="text-primary">Regístrate aquí</router-link>
              </div>
              <div class="text-center mt-3">
                ¿Olvidaste tu contraseña?<br>
                <router-link to="/auth/forgot-password" class="text-primary">Recuperala aquí</router-link>
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
import Toastify from 'toastify-js'
import { loginUser } from '@/domain/usecases/auth/LoginUser'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)
const errorMessage = ref('')

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  errorMessage.value = ''
  loading.value = true

  try {
    const user = await loginUser(form)

    userStore.setUser(user) // Guarda en store + localStorage

    Toastify({
      text: `¡Bienvenido ${user.name || 'null'}!`,
      duration: 3000,
      gravity: 'top',
      position: 'right',
      style: { background: 'linear-gradient(to right, #00b09b, #96c93d)' }
    }).showToast()

    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  } catch (err: any) {
    errorMessage.value = err.message || 'Error al iniciar sesión'

    Toastify({
      text: errorMessage.value,
      duration: 4000,
      gravity: 'top',
      position: 'right',
      style: { background: '#e63946' }
    }).showToast()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-login {
  min-height: 100vh;
  background-image: url("@/assets/img/bg-hero.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #102c4a;
  padding-top: 43px;
}

.card {
  padding: 20px;
  background-color: #5c616544;
  border-radius: 1rem;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
</style>
