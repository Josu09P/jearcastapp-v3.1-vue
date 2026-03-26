<template>
  <div class="header-top">
    <div class="header-container">
      <!-- Logo y botón de menú -->
      <div class="header-left">
        <button class="menu-toggle" @click="toggleSidebar">
          <i class="bi bi-display" v-if="!isSidebarCollapsed"
            style="font-size: 18px !important; color: white !important;"></i>
          <i class="bi bi-display-fill" v-else style="font-size: 18px !important; color: white !important;"></i>
        </button>
        <div class="logo">
          <span class="logo-text"
            style="background: var(--brand-gradient); -webkit-background-clip: text; background-clip: text; color: transparent;">
            Steel Music
          </span>
        </div>
      </div>

      <!-- Buscador (centrado en desktop) -->
      <div class="search-wrapper">
        <form @submit.prevent="openSearch" class="search-form">
          <i class="bi bi-search search-icon" style="color: white !important;"></i>
          <input type="text" @click="openSearch" readonly ref="searchInput" />
          <kbd class="search-shortcut"></kbd>
        </form>
      </div>

      <!-- Perfil y acciones -->
      <div class="header-right">
        <div class="user-info">
          <div class="user-avatar">
            <span>{{ userInitials }}</span>
          </div>
          <div class="user-details">
            <span class="user-name">{{ userName }}</span>
          </div>
        </div>
        <button class="logout-btn" @click="logout" title="Cerrar sesión">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
  <MusicSearchOverlay :visible="showSearch" @close="closeSearch" @openPlaylistModal="openPlaylistModal"
    ref="searchOverlay" />
</template>

<script setup lang="ts">
import Swal from 'sweetalert2'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import MusicSearchOverlay from './search/MusicSearchOverlay.vue'
import type { ComponentPublicInstance } from 'vue'

// Define el tipo del overlay
interface MusicSearchOverlayInstance extends ComponentPublicInstance {
  focusInput: () => void
}

const showSearch = ref(false)
const searchOverlay = ref<MusicSearchOverlayInstance | null>(null)

const openSearch = () => {
  showSearch.value = true
  setTimeout(() => {
    searchOverlay.value?.focusInput()
  }, 100)
}

const closeSearch = () => {
  showSearch.value = false
}

const openPlaylistModal = (video: any) => {
  console.log('Agregar a playlist:', video)
}

const router = useRouter()
const userStore = useUserStore()
const userName = computed(() => userStore.name)
const userInitials = computed(() => {
  return userName.value
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const logout = async () => {
  const result = await Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Tu sesión se cerrará y volverás al login.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
    customClass: {
      popup: 'glass-modal',
      title: 'text-white',
      htmlContainer: 'text-white',
      confirmButton: 'btn btn-danger me-2',
      cancelButton: 'btn btn-secondary'
    },
    buttonsStyling: false
  })

  if (result.isConfirmed) {
    userStore.logout()
    router.push('/auth/login').then(() => {
      window.location.reload()
    })
  }
}

const emit = defineEmits(['toggle-sidebar'])
const props = defineProps({
  isSidebarCollapsed: Boolean
})

function toggleSidebar() {
  emit('toggle-sidebar')
}
</script>
<style scoped>
.header-top {
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2.70rem 1.5rem 0.75rem;
}

.header-container {
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* Left Section */
.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.menu-toggle {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.3rem;
  width: 33px;
  height: 33px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-toggle:hover {
  background: rgba(255, 255, 255, 0.1);
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}


.logo-text {
  font-size: 1.25rem;
  font-weight: 600;
  background: var(--brand-gradient);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Search Section */
.search-wrapper {
  flex: 1;
  max-height: 40px !important;
  max-width: 100px;
  margin: 0 auto;
}

.search-form {
  position: relative;
  height: 40px;
  width: 100%;
}

.search-form input {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  color: white;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.search-form input:focus {
  outline: none;
  border-color: #1db954;
  background: rgba(255, 255, 255, 0.08);
}

.search-form input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 1rem;
  pointer-events: none;
}

.search-shortcut {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 6px;
  padding: 0.2rem 0.5rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
  font-family: monospace;
}

/* Right Section */
.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.25rem 0.75rem 0.25rem 0.5rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.user-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #d2c8c8, var(--accent-color));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;

}

.user-avatar span {
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: white;
}

.user-role {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.4);
}

.logout-btn {
  display: flex;
  align-items: center;
  width: 40px;
  height: 40px;
  margin: 0 auto;
  gap: 0.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  padding-left: 13px;
  padding-right: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.logout-btn:hover {
  color: #ff4d4d;
}

.logout-btn i {
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .header-container {
    gap: 0.75rem;
  }

  .user-details {
    display: none;
  }

  .logo-text {
    display: none;
  }

  .logout-btn span {
    display: none;
  }

  .logout-btn {
    padding: 0.5rem;
  }
}

@media (max-width: 768px) {
  .header-top {
    padding: 0.5rem 1rem;
  }

  .search-wrapper {
    max-width: 20px;
    margin: 0 !important;
    padding: 0 !important;
    display: flex;
  }

  .search-shortcut {
    display: none;
    margin: 0 !important;
    padding: 0 !important;
  }

  .search-shortcut {
    display: none;
  }
}

@media (max-width: 576px) {
  .search-wrapper {
    max-width: 10px;
  }

  .user-info {
    padding: 0.25rem;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
  }

  .user-avatar span {
    font-size: 0.7rem;
  }
}
</style>