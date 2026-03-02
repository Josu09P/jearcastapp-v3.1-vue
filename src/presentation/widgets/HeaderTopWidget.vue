<template>
  <nav class="navbar navbar-expand-lg navbar-light">
    <div class="container-fluid">
      <button class="toggle-sidebar btn d-md-none" @click="toggleSidebar">
        <i class="bi bi-speaker fs-4 text-white icon-header-top"></i>
      </button>

      <h4 class="mb-0 ms-3 d-flex align-items-center">
        <div class="d-flex align-items-center me-3">
          <img src="@/assets/img/logo-v3.png" width="90" alt="Logo" style="filter: brightness(0) invert(1);"
            class="me-4 img-logo-app" />
          <button class="toggle-sidebar ms-3 d-none d-md-block" @click="toggleSidebar"
            style=" border: none; border-radius: 10px; padding: 5px; background-color: transparent;">
            <i class="bi bi-speaker fs-3" style="color: #f4f4f4;"></i>
          </button>
        </div>
      </h4>
      <!--BUSCADOR AQUI-->
      <div class="mx-auto d-none d-lg-block" style="width: 20%; margin-top: 0; margin-bottom: 0;">
        <form class="d-flex" @submit.prevent="showSearch = true">
          <button class="btn btn-outline-light px-3 d-flex align-items-center border-0" type="submit"
            style="font-size: 15px;">
            <span>Buscar</span>
            <i class="bi bi-search ms-2" style="font-size: 13px; vertical-align: middle;"></i>
          </button>
        </form>

      </div>

      <div class="d-flex align-items-center order-2 order-lg-3 mt-2 mt-lg-0">
        <span class="me-3" style="color: rgb(229, 229, 229); font-size: 14px;">
          {{ userName }}
        </span>
        <button class="btn btn-sm" title="Cerrar sesión" style="color: rgb(229, 229, 229);" @click="logout">
          <i class="bi bi-door-open-fill fs-5"></i>
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
      rgba(178, 178, 178, 0.05) 0%,
      /* Un poco más visible arriba */
      rgba(178, 178, 178, 0.05) 50%,
      /* Color medio */
      transparent 100%
      /* Totalmente transparente abajo */
    );
  -webkit-backdrop-filter: var(--blur-efect-global);
  border: border !important;
  border-radius: 1.0rem 1.0rem 0 0 !important;
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
