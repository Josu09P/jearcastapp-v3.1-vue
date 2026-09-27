<template>
  <div class="app-layout" :class="{ 'has-bottom-player': hasBottomPlayer }">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }">
      <HeaderLeftWidget @toggle-sidebar="toggleSidebar" />
    </aside>

    <!-- Main Content -->
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }">
      <HeaderTopWidget @toggle-sidebar="toggleSidebar" :is-sidebar-collapsed="isSidebarCollapsed" />
      <main class="content-area" :class="{ 'has-bottom-player': hasBottomPlayer }">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, provide, ref, watch } from 'vue';
import HeaderTopWidget from '@/presentation/widgets/HeaderTopWidget.vue';
import HeaderLeftWidget from '@/presentation/widgets/HeaderLeftWidget.vue';
import { useUserDataStore } from '@/stores/userDataStore';
import { useArtistStore } from '@/stores/artist-store';
import { useUserStore } from '@/stores/user';
import { usePlayerStore } from '@/stores/player-store';
import { useApiKeyManager } from '@/composables/useApiKeyManager';

const userDataStore = useUserDataStore();
const artistStore = useArtistStore();
const userStore = useUserStore();
const playerStore = usePlayerStore();
const apiKeyManager = useApiKeyManager();

const hasBottomPlayer = computed(() => playerStore.playerMode === 'bottom-bar');

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
})

// Un solo watch robusto para manejar el cambio de usuario y la carga inicial
watch(() => userStore.id, async (newId, oldId) => {
  if (newId) {
    if (newId !== oldId || !artistStore.initialized) {
      console.log('🎤 Dashboard: Cargando/Refrescando artistas favoritos y API keys...')
      await Promise.all([
        artistStore.fetchFavoriteArtists(),
        apiKeyManager.initialize()
      ])
    }
  } else {
    // Usuario cerró sesión
    artistStore.clearStore()
  }
}, { immediate: true })
</script>

<style scoped>
.app-layout {
  position: relative;
  display: flex;
  height: 100vh;
  width: 100%;
  background: var(--main-bg-color);
  background-attachment: fixed;
  overflow: hidden;
  transition: height 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.app-layout.has-bottom-player {
  height: calc(100vh - 78px) !important;
  max-height: calc(100vh - 78px) !important;
}

.sidebar {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 260px;
  height: 100%;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100;
  visibility: visible;
  opacity: 1;
}

.app-layout.has-bottom-player .sidebar {
  height: 100% !important;
  max-height: calc(100vh - 78px) !important;
  bottom: 0 !important;
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
  height: 100%;
  display: flex;
  flex-direction: column;
  width: calc(100% - 260px);
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.25) transparent;
}

.main-content::-webkit-scrollbar {
  width: 8px;
}

.main-content::-webkit-scrollbar-track {
  background: transparent;
}

.main-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  border: 2px solid transparent;
  background-clip: padding-box;
  cursor: pointer;
  transition: background 0.2s ease;
}

.main-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.45);
}

.main-content::-webkit-scrollbar-thumb:active {
  background: rgba(255, 255, 255, 0.65);
}

.app-layout.has-bottom-player .main-content {
  height: 100% !important;
  max-height: calc(100vh - 78px) !important;
}

.main-content.expanded {
  margin-left: 0;
  width: 100%;
}

.content-area {
  flex: 1;
  padding: 1.5rem 1.5rem 2.5rem 1.5rem;
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