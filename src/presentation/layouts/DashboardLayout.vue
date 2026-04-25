<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <HeaderLeftWidget @toggle-sidebar="toggleSidebar" />
    </aside>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <HeaderTopWidget @toggle-sidebar="toggleSidebar" :is-sidebar-collapsed="isSidebarCollapsed" />
      <main class="content-area">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, provide, ref, watch } from 'vue';
import HeaderTopWidget from '@/presentation/widgets/HeaderTopWidget.vue';
import HeaderLeftWidget from '@/presentation/widgets/HeaderLeftWidget.vue';
import { useUserDataStore } from '@/stores/userDataStore';
import { useArtistStore } from '@/stores/artist-store';
import { useUserStore } from '@/stores/user';

const userDataStore = useUserDataStore();
const artistStore = useArtistStore();
const userStore = useUserStore();

const isSidebarCollapsed = ref(false);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

const activeSection = ref('home')
const changeSection = (section: string) => {
  activeSection.value = section
}

provide('activeSection', activeSection)
provide('changeSection', changeSection)

// ==================== INICIALIZACIÓN DE DATOS ====================

// Cargar datos principales al montar
onMounted(async () => {
  await Promise.all([
    userDataStore.fetchFavorites(),
    userDataStore.fetchPlaylists(),
    userDataStore.fetchRecommended(),
  ])

  // Cargar artistas favoritos si hay usuario
  if (userStore.id) {
    console.log('🎤 Dashboard: Cargando artistas favoritos...')
    await artistStore.fetchFavoriteArtists()
  }
})

// Recargar artistas cuando el usuario inicia/cierra sesión
watch(() => userStore.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log('Usuario autenticado, recargando artistas favoritos...')
    // Invalidar caché y recargar
    await artistStore.invalidateAndRefresh()
  } else if (!newId && oldId) {
    // Usuario cerró sesión - limpiar store
    console.log('Usuario cerró sesión, limpiando artistas...')
    artistStore.favoriteArtists = []
    artistStore.initialized = false
  }
})

// También recargar cuando el usuario se carga desde localStorage
watch(() => userStore.id, async (newId) => {
  if (newId && !artistStore.initialized) {
    console.log('Usuario cargado desde localStorage, recargando artistas...')
    await artistStore.fetchFavoriteArtists()
  }
}, { immediate: true })
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--main-bg-color);
  background-attachment: fixed;
  overflow: hidden;
}

.sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 260px;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
  visibility: visible;
  opacity: 1;
}

.sidebar.collapsed {
  transform: translateX(-100%);
  visibility: hidden;
  opacity: 0;
}

.main-content {
  flex: 1;
  margin-left: 260px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 100vh;
  display: flex;
  flex-direction: column;
  width: calc(100% - 260px);
  overflow-y: auto;
}

.main-content.expanded {
  margin-left: 0;
  width: 100%;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
  overflow-x: auto;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 1024px) {
  .content-area {
    padding: 1.25rem;
  }
}

@media (max-width: 768px) {
  .app-layout {
    padding-top: 31px;
  }

  .sidebar {
    transform: translateX(-100%);
    background: rgba(255, 255, 255, 0);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    opacity: 0;
    visibility: hidden;
  }

  .sidebar.collapsed {
    transform: translateX(0);
    opacity: 1;
    visibility: visible;
  }

  .main-content {
    margin-left: 0;
    width: 100%;
  }

  .content-area {
    padding: 1rem;
  }
}

@media (max-width: 576px) {
  .content-area {
    padding: 0.75rem;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 0.5rem;
  }
}
</style>