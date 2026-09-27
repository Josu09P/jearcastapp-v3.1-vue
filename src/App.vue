<template>
  <div :class="{ 'is-miniplayer-view': playerStore.playerMode === 'miniplayer' }">
    <NavbarCustom v-show="playerStore.playerMode !== 'miniplayer'" />
    <span v-show="playerStore.playerMode !== 'miniplayer'" style="margin-bottom: 20px;"></span>
    <div v-show="playerStore.playerMode !== 'miniplayer'">
      <router-view />
    </div>
    <teleport to='body'>
      <PlayerGlobalWidget />
    </teleport>
  </div>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import NavbarCustom from './presentation/widgets/navbar/NavbarCustom.vue';
import PlayerGlobalWidget from './presentation/widgets/player/PlayerGlobalWidget.vue';
import { useUserStore } from '@/stores/user';
import { useArtistStore } from '@/stores/artist-store';
import { usePlayerStore } from '@/stores/player-store';
import { useMiddleClickAutoscroll } from '@/composables/useMiddleClickAutoscroll';

const userStore = useUserStore();
const artistStore = useArtistStore();
const playerStore = usePlayerStore();
const isMaximized = ref(false);

useMiddleClickAutoscroll();

watch(() => playerStore.playerMode, (mode) => {
  if (mode === 'miniplayer') {
    document.body.classList.add('is-miniplayer-active');
  } else {
    document.body.classList.remove('is-miniplayer-active');
  }
}, { immediate: true });

const handleMaximized = () => {
  isMaximized.value = true;
  document.body.classList.add('is-maximized');
};

const handleUnmaximized = () => {
  isMaximized.value = false;
  document.body.classList.remove('is-maximized');
};

onMounted(async () => {
  // Inicializar usuario desde localStorage
  userStore.loadUserFromLocalStorage();
  
  // Si hay usuario, cargar sus artistas favoritos inmediatamente
  if (userStore.id) {
    await artistStore.fetchFavoriteArtists();
  }

  // Escuchar eventos de Electron
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('window-maximized', handleMaximized);
    window.electron.ipcRenderer.on('window-unmaximized', handleUnmaximized);
    window.electron.ipcRenderer.on('enter-full-screen', handleMaximized);
    window.electron.ipcRenderer.on('leave-full-screen', handleUnmaximized);
  }

  if (window.electron?.onMiniplayerState) {
    window.electron.onMiniplayerState((isMini: boolean) => {
      playerStore.playerMode = isMini ? 'miniplayer' : 'bottom-bar';
    });
  }

  // Escuchar cambios de pantalla completa estándar
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      handleMaximized();
    } else {
      handleUnmaximized();
    }
  });
});

onUnmounted(() => {
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.removeListener('window-maximized', handleMaximized);
    window.electron.ipcRenderer.removeListener('window-unmaximized', handleUnmaximized);
    window.electron.ipcRenderer.removeListener('enter-full-screen', handleMaximized);
    window.electron.ipcRenderer.removeListener('leave-full-screen', handleUnmaximized);
  }
  if (window.electron?.removeMiniplayerStateListener) {
    window.electron.removeMiniplayerStateListener();
  }
});
</script>