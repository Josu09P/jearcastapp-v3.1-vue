<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import { useUserStore } from '@/stores/user'
import type { UserUpdateModel, ApiKeyModel } from '@/domain/models/UserModel'
import Toastify from 'toastify-js'
import Swal from 'sweetalert2'
import { updateUser } from '@/domain/usecases/users/UpdateUserUseCase'
import { addApiKey, removeApiKey, toggleApiKeyStatus } from '@/domain/usecases/users/UpdateApiKeyUseCase'
import { getApiKeys } from '@/domain/usecases/users/GetApiKeysUseCase'

const userStore = useUserStore()
const loading = ref(false)
const editing = ref(false)
const savingApiKey = ref(false) // Nuevo estado para prevenir múltiples clics

// Formulario de perfil
const profileForm = ref<UserUpdateModel>({
    name: '',
    email: '',
    apikeyYoutube: ''
})

// API Keys
const apiKeys = ref<ApiKeyModel[]>([])
const showApiKeyForm = ref(false)
const newApiKey = ref({
    key: '',
    service: 'youtube' as const,
    isActive: true
})

// Cargar API Keys
const loadApiKeys = async () => {
    if (!userStore.id) return
    try {
        apiKeys.value = await getApiKeys(userStore.id)
    } catch (error) {
        console.error('Error cargando API Keys:', error)
    }
}

// Cargar datos del usuario
onMounted(async () => {
    if (userStore.id) {
        profileForm.value = {
            name: userStore.name,
            email: userStore.email,
            apikeyYoutube: userStore.apikeyYoutube
        }
        await loadApiKeys()
    }
})

// Actualizar perfil
const updateProfile = async () => {
    if (!userStore.id) return

    loading.value = true
    try {
        const updatedUser = await updateUser(userStore.id, profileForm.value)
        userStore.setUser(updatedUser)
        editing.value = false

        Toastify({
            text: 'Actualizado exitosamente',
            duration: 3000,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } catch (error) {
        console.error('Error:', error)
        Toastify({
            text: 'Error al actualizar perfil',
            duration: 3000,
            className: 'toast-glass bg-danger',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } finally {
        loading.value = false
    }
}

// Verificar si la API Key ya existe
const isApiKeyDuplicate = (key: string): boolean => {
    return apiKeys.value.some(apiKey => apiKey.key === key)
}

// Agregar API Key con prevención de duplicados y múltiples clics
const addNewApiKey = async () => {
    // Validaciones iniciales
    if (!userStore.id || !newApiKey.value.key || savingApiKey.value) return

    // Verificar duplicados
    if (isApiKeyDuplicate(newApiKey.value.key)) {
        Toastify({
            text: 'Esta API Key ya existe',
            duration: 3000,
            className: 'toast-glass bg-warning',
            gravity: 'top',
            position: 'right'
        }).showToast()
        return
    }

    savingApiKey.value = true // Bloquear múltiples clics

    try {
        await addApiKey(userStore.id, newApiKey.value)
        await loadApiKeys() // Recargar la lista

        showApiKeyForm.value = false
        newApiKey.value = { key: '', service: 'youtube', isActive: true }

        Toastify({
            text: 'API Key agregada',
            duration: 3000,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } catch (error) {
        console.error('Error:', error)
        Toastify({
            text: 'Error al agregar API Key',
            duration: 3000,
            className: 'toast-glass bg-danger',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } finally {
        savingApiKey.value = false // Desbloquear
    }
}

// Confirmar eliminación de API Key
const confirmRemoveApiKey = async (apiKey: ApiKeyModel) => {
    const result = await Swal.fire({
        title: '¿Eliminar API Key?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'glass-modal',
            title: 'text-white',
            htmlContainer: 'text-white',
            confirmButton: 'btn btn-danger me-2',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    })

    if (result.isConfirmed && userStore.id) {
        try {
            await removeApiKey(userStore.id, apiKey)
            await loadApiKeys() // Recargar la lista

            Toastify({
                text: 'API Key eliminada',
                duration: 3000,
                className: 'toast-glass',
                gravity: 'top',
                position: 'right'
            }).showToast()
        } catch (error) {
            console.error('Error:', error)
        }
    }
}

// Cambiar estado de API Key
const toggleApiKey = async (apiKey: ApiKeyModel) => {
    if (!userStore.id) return

    try {
        await toggleApiKeyStatus(userStore.id, apiKey)
        await loadApiKeys() // Recargar la lista

        Toastify({
            text: apiKey.isActive ? 'API Key desactivada' : 'API Key activada',
            duration: 3000,
            className: 'toast-glass',
            gravity: 'top',
            position: 'right'
        }).showToast()
    } catch (error) {
        console.error('Error:', error)
    }
}
</script>
<template>
    <DashboardLayout>
        <div class="container-fluid px-4 py-4">
            <!-- Header minimalista -->
            <div class="d-flex justify-content-between align-items-center"
                style="margin-top: -27px; margin-left: -10px;">
                <h4 class="text-white mb-0 fw-bold">Configuración</h4>
            </div>
            <br>
            <!-- Grid de 3 columnas -->
            <div class="settings-grid">
                <!-- Tarjeta 1: Perfil -->
                <div class="settings-card">
                    <div class="card-header">
                        <i class="bi bi-person-circle" style="color: white !important;"></i>
                        <h5>Perfil</h5>
                    </div>

                    <div class="card-content">
                        <div class="info-row">
                            <span class="info-label">Nombre</span>
                            <div class="info-value">
                                <input v-if="editing" v-model="profileForm.name" type="text" class="edit-input"
                                    placeholder="Tu nombre">
                                <span v-else>{{ profileForm.name || '—' }}</span>
                            </div>
                        </div>

                        <div class="info-row">
                            <span class="info-label">Email</span>
                            <div class="info-value">
                                <input v-if="editing" v-model="profileForm.email" type="email" class="edit-input"
                                    placeholder="tu@email.com">
                                <span v-else>{{ profileForm.email }}</span>
                            </div>
                        </div>

                        <div class="info-row">
                            <span class="info-label">API Key</span>
                            <div class="info-value">
                                <input v-if="editing" v-model="profileForm.apikeyYoutube" type="text"
                                    class="edit-input font-monospace" placeholder="AIza...">
                                <span v-else class="font-monospace">
                                    {{ profileForm.apikeyYoutube ? '••••••••' + profileForm.apikeyYoutube.slice(-4) :
                                        '—' }}
                                </span>
                            </div>
                        </div>

                        <!-- Botones de acción del perfil -->
                        <div v-if="!editing" class="card-actions">
                            <button @click="editing = true" class="action-btn">
                                <i class="bi bi-pencil" style="color: white !important;"></i>
                                Editar
                            </button>
                        </div>
                        <div v-else class="card-actions">
                            <button @click="editing = false" class="action-btn cancel">
                                Cancelar
                            </button>
                            <button @click="updateProfile" :disabled="loading" class="action-btn save">
                                <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta 2: API Keys de Respaldo -->
                <div class="settings-card">
                    <div class="card-header">
                        <i class="bi bi-key" style="color: white !important;"></i>
                        <h5>API Keys de Respaldo</h5>
                        <button @click="showApiKeyForm = !showApiKeyForm" class="add-btn">
                            <i class="bi bi-plus-lg"></i>
                        </button>
                    </div>

                    <div class="card-content">
                        <!-- Formulario nueva API Key -->
                        <div v-if="showApiKeyForm" class="api-form">
                            <select v-model="newApiKey.service" class="form-select">
                                <option value="youtube">YouTube</option>
                            </select>
                            <input v-model="newApiKey.key" type="text" class="form-input font-monospace"
                                placeholder="API Key">
                            <div class="form-actions">
                                <button @click="showApiKeyForm = false" class="action-btn cancel small">
                                    Cancelar
                                </button>
                                <button @click="addNewApiKey" :disabled="savingApiKey || !newApiKey.key"
                                    class="action-btn save small">
                                    <span v-if="savingApiKey" class="spinner-border spinner-border-sm me-1"></span>
                                    Guardar
                                </button>
                            </div>
                        </div>

                        <!-- Lista de API Keys -->
                        <div v-if="apiKeys.length === 0 && !showApiKeyForm" class="empty-state">
                            <i class="bi bi-key"></i>
                            <p>No hay keys de respaldo</p>
                        </div>

                        <div v-else class="keys-list">
                            <div v-for="(key, index) in apiKeys" :key="index" class="key-item">
                                <div class="key-info">
                                    <span class="status-dot" :class="{ 'active': key.isActive }"></span>
                                    <span class="service-badge">{{ key.service }}</span>
                                    <code class="key-preview">{{ key.key.slice(0, 20) }}...</code>
                                </div>
                                <div class="key-actions">
                                    <button @click="toggleApiKey(key)" class="icon-btn"
                                        :title="key.isActive ? 'Desactivar' : 'Activar'">
                                        <i :class="key.isActive ? 'bi bi-pause-fill' : 'bi bi-play-fill'"></i>
                                    </button>
                                    <button @click="confirmRemoveApiKey(key)" class="icon-btn" title="Eliminar">
                                        <i class="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tarjeta 3: Diseñador (Themes) -->
                <div class="settings-card theme-card">
                    <div class="card-header">
                        <i class="bi bi-palette-fill" style="color: white !important;"></i>
                        <h5>Apariencia</h5>
                    </div>

                    <div class="card-content">
                        <p class="theme-description">Personaliza la apariencia de la APP (Themas experimental
                            desarrollo)</p>
                        <button @click="$router.push('/dashboard/themes')" class="theme-link">
                            <span>Ir ya</span>
                            <i class="bi bi-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </DashboardLayout>
</template>

<style scoped>
@import url('@/assets/css/settings-styles.css');
</style>
