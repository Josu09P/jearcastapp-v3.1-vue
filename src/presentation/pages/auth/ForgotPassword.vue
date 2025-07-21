<template>
    <div class="d-flex align-items-center justify-content-center auth-login">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="card shadow-sm text-white">
                        <div class="card-body">
                            <h2 class="card-title text-center mb-4 fw-bold">
                                <img src="@/assets/img/logo-v3.png" alt="Logo" width="80"
                                    style="filter: brightness(0) invert(1); margin-bottom: 10px;" />
                                <br />
                                Recuperar contraseña
                            </h2>

                            <form @submit.prevent="handleSubmit">
                                <div class="mb-3">
                                    <label for="email" class="form-label">Correo electrónico</label>
                                    <input v-model="email" type="email" id="email" class="form-control"
                                        placeholder="jearcast@gmail.com" required />
                                </div>

                                <div class="d-grid gap-2">
                                    <button type="submit" class="btn btn-warning" :disabled="loading">
                                        {{ loading ? "Enviando..." : "Enviar enlace de recuperación" }}
                                    </button>
                                </div>
                            </form>

                            <div class="text-center mt-3">
                                <router-link to="/auth/login" class="text-primary">Volver al inicio de
                                    sesión</router-link>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Toastify from 'toastify-js'
import { resetPassword } from '@/data/services/auth/forgot.password'


const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const router = useRouter()

const handleSubmit = async () => {
    errorMessage.value = ''
    loading.value = true

    try {
        await resetPassword(email.value.trim())

        Toastify({
            text: "📧 Se ha enviado un enlace de recuperación a tu correo.",
            duration: 4000,
            gravity: "top",
            position: "right",
            style: { background: "#06d6a0" }
        }).showToast()

        setTimeout(() => {
            router.push('/auth/login')
        }, 2000)
    } catch (error: any) {
        console.error(error)
        errorMessage.value = "❌ Ocurrió un error. Verifica el correo e intenta nuevamente."

        Toastify({
            text: errorMessage.value,
            duration: 4000,
            gravity: "top",
            position: "right",
            style: { background: "#e63946" }
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
}

.card {
    padding: 20px;
    background-color: #5c616544;
    border-radius: 1rem;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}
</style>
