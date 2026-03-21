<template>
  <nav class="navbar navbar-expand-lg navbar-light">
    <div class="container-fluid">
      <button class="toggle-sidebar btn d-md-none" @click="toggleSidebar">
        <i class="bi bi-speaker fs-4 text-white icon-header-top"></i>
      </button>

      <h4 class="mb-0 ms-3 d-flex align-items-center">
        <div class="d-flex align-items-center me-3">
          <img src="@/assets/img/logo-v3.png" width="80" alt="Logo" style="filter: brightness(0) invert(1);"
            class="me-4 img-logo-app" />
          <button class="toggle-sidebar ms-3 d-none d-md-block" @click="toggleSidebar"
            style=" border: none; padding: 5px; background-color: transparent !important;">
            <i class="bi bi-arrow-bar-left fs-6"
              style="color: #f4f4f4; border-radius: 1.3rem !important; backdrop-filter: var(--blur-efect-global); padding: 4px; border: 1px solid rgba(255, 255, 255, 0.08);"></i>
          </button>
        </div>
      </h4>
      <!--BUSCADOR AQUI-->
      <div class="mx-auto d-none d-lg-block" style="width: 20%; margin-top: 0; margin-bottom: 0;">
        <form class="d-flex" @submit.prevent="showSearch = true">
          <button class="btn btn-dark px-3 d-flex align-items-center" type="submit"
            style="font-size: 15px; background-color: transparent; border: 1px solid rgba(255, 255, 255, 0.08) !important; border-radius: 1.0rem;">
            <span style="font-size: 13px;">Buscar</span>
            <i class="bi bi-search ms-2" style="font-size: 13px; vertical-align: middle;"></i>
          </button>
        </form>

      </div>

      <div class="d-flex align-items-center order-2 order-lg-3 mt-2 mt-lg-0">
        <span class="me-1" style="color: rgb(229, 229, 229); font-size: 13px;">
          {{ userName }}
        </span>
        <button class="btn btn-sm" title="Cerrar sesión" style="color: rgb(229, 229, 229);" @click="logout">
          <i class="bi bi-door-open-fill" style="font-size: 16px;"></i>
        </button>
      </div>
    </div>
  </nav>
  <MusicSearchOverlay :visible="showSearch" @close="showSearch = false" @openPlaylistModal="openPlaylistModal" />
</template>

<script setup lang="ts">
import Swal from 'sweetalert2'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import MusicSearchOverlay from './search/MusicSearchOverlay.vue'
const showSearch = ref(false)

const openPlaylistModal = (video: any) => {
  console.log('Agregar a playlist:', video)
}
const router = useRouter()
const userStore = useUserStore()
const userName = computed(() => userStore.name)

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
    userStore.logout() // ✅ logout desde el store
    router.push('/auth/login').then(() => {
      window.location.reload()
    })
  }
}

const emit = defineEmits(['toggle-sidebar']);
const props = defineProps({
  isSidebarCollapsed: Boolean
});

function toggleSidebar() {
  emit('toggle-sidebar');
}
</script>

<style scoped>
nav.navbar {
  backdrop-filter: var(--blur-efect-global);
  background: linear-gradient(to bottom,
      #8e999d12 0%,
      rgba(178, 178, 178, 0.05) 60%,
      transparent 100%);
  -webkit-backdrop-filter: var(--blur-efect-global);
  border-top: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-left: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
  border-radius: 0.50rem 0.50rem 0 0 !important;
}

.bi-search {
  width: 13px;
}

@media (max-width: 768px) {
  .icon-header-top {
    font-size: 39px !important;
  }

  .img-logo-app {
    margin-left: -100px;
    width: 77px;
  }
}
</style>
