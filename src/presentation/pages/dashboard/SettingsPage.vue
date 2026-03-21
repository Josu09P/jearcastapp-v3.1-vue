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
            <div class="d-flex justify-content-between align-items-center mb-5">
                <h4 class="text-white mb-0 fw-bold">Configuración</h4>
            </div>

            <!-- Grid de 3 columnas -->
            <div class="settings-grid">
                <!-- Tarjeta 1: Perfil -->
                <div class="settings-card">
                    <div class="card-header">
                        <i class="bi bi-person-circle"></i>
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
                                <i class="bi bi-pencil"></i>
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
                        <i class="bi bi-key"></i>
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
                        <i class="bi bi-palette-fill"></i>
                        <h5>Themas</h5>
                    </div>

                    <div class="card-content">
                        <p class="theme-description">Personaliza la apariencia de la aplicación</p>
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
/* Grid principal */
.settings-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
}

@media (min-width: 768px) {
    .settings-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 1200px) {
    .settings-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

/* Tarjetas */
.settings-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
}

.settings-card:hover {
    border-color: rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.03);
}

/* Header de tarjeta */
.card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.card-header i {
    font-size: 1.25rem;
    color: rgba(255, 255, 255, 0.5);
}

.card-header h5 {
    margin: 0;
    font-size: 1rem;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.5px;
    flex: 1;
}

/* Contenido de tarjeta */
.card-content {
    padding: 1.5rem;
}

/* Filas de información */
.info-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
    border-bottom: none;
}

.info-label {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.85rem;
    font-weight: 300;
    letter-spacing: 0.3px;
}

.info-value {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    max-width: 60%;
    text-align: right;
    word-break: break-word;
}

/* Inputs de edición */
.edit-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.9rem;
    padding: 0.25rem 0;
    width: 100%;
    text-align: right;
    transition: border-color 0.2s ease;
}

.edit-input:focus {
    outline: none;
    border-bottom-color: rgba(255, 255, 255, 0.3);
}

.edit-input.font-monospace {
    font-size: 0.8rem;
}

/* Acciones de tarjeta */
.card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

/* Botones de acción */
.action-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.85rem;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

.action-btn i {
    font-size: 0.9rem;
}

.action-btn:hover {
    color: rgba(255, 255, 255, 0.9);
}

.action-btn.save {
    color: #1db954;
}

.action-btn.save:hover {
    color: #1ed760;
}

.action-btn.cancel:hover {
    color: #ff4d4d;
}

.action-btn.small {
    font-size: 0.75rem;
    padding: 0.2rem 0.4rem;
}

.action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

/* Botón de añadir */
.add-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    font-size: 1rem;
    padding: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-btn:hover {
    color: #1db954;
    transform: scale(1.1);
}

/* Formulario de API */
.api-form {
    margin-bottom: 1.5rem;
}

.form-select {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.85rem;
    padding: 0.5rem 0;
    width: 100%;
    margin-bottom: 1rem;
}

.form-select option {
    background: #000;
    color: white;
}

.form-select:focus {
    outline: none;
    border-bottom-color: rgba(255, 255, 255, 0.3);
}

.form-input {
    background: transparent;
    border: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 0.85rem;
    padding: 0.5rem 0;
    width: 100%;
    margin-bottom: 1rem;
}

.form-input:focus {
    outline: none;
    border-bottom-color: rgba(255, 255, 255, 0.3);
}

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}

/* Lista de keys */
.keys-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.key-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.key-item:last-child {
    border-bottom: none;
}

.key-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
}

.status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    flex-shrink: 0;
}

.status-dot.active {
    background: #1db954;
    box-shadow: 0 0 8px rgba(29, 185, 84, 0.3);
}

.service-badge {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
}

.key-preview {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    font-family: 'Monaco', 'Menlo', monospace;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.key-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
}

.icon-btn {
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.8rem;
    padding: 0.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.icon-btn:hover {
    color: rgba(255, 255, 255, 0.8);
}

.icon-btn:hover i.bi-pause-fill {
    color: #ff4d4d;
}

.icon-btn:hover i.bi-play-fill {
    color: #1db954;
}

.icon-btn:hover i.bi-x-lg {
    color: #ff4d4d;
}

/* Estado vacío */
.empty-state {
    text-align: center;
    padding: 2rem 0;
}

.empty-state i {
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.1);
    margin-bottom: 0.75rem;
}

.empty-state p {
    color: rgba(255, 255, 255, 0.2);
    font-size: 0.85rem;
    font-weight: 300;
    margin: 0;
}

/* Tarjeta de diseñador especial */
.theme-card {
    background: linear-gradient(135deg, rgba(29, 185, 84, 0.05) 0%, rgba(0, 0, 0, 0) 100%);
}

.theme-description {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.85rem;
    font-weight: 300;
    margin-bottom: 1.5rem;
    line-height: 1.5;
}

.theme-link {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    color: #ffffff;
    background: rgba(112, 115, 113, 0.1);
    text-decoration: none;
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
    border: 1px solid rgba(29, 185, 84, 0.2);
    border-radius: 30px;
    transition: all 0.2s ease;
    width: fit-content;
}

.theme-link:hover {
    background: rgba(29, 185, 84, 0.1);
    border-color: rgba(29, 185, 84, 0.4);
    gap: 1rem;
}

.theme-link i {
    font-size: 0.8rem;
    transition: transform 0.2s ease;
}

.theme-link:hover i {
    transform: translateX(4px);
}

/* Utilidades */
.font-monospace {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 0.8rem;
}

/* Hover effects sutiles */
.btn-link {
    opacity: 0.7;
    transition: opacity 0.2s ease;
}

.btn-link:hover {
    opacity: 1;
}
</style>
