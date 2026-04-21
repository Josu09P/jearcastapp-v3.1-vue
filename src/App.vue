<template>
  <NavbarCustom />
  <span style="margin-bottom: 20px;"></span>
  <router-view />
  <teleport to='body'>
    <PlayerGlobalWidget />
  </teleport>
</template>
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import NavbarCustom from './presentation/widgets/navbar/NavbarCustom.vue';
import PlayerGlobalWidget from './presentation/widgets/player/PlayerGlobalWidget.vue';

const isMaximized = ref(false);

const handleMaximized = () => {
  isMaximized.value = true;
  document.body.classList.add('is-maximized');
};

const handleUnmaximized = () => {
  isMaximized.value = false;
  document.body.classList.remove('is-maximized');
};

onMounted(() => {
  // Escuchar eventos de Electron
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.on('window-maximized', handleMaximized);
    window.electron.ipcRenderer.on('window-unmaximized', handleUnmaximized);
    window.electron.ipcRenderer.on('enter-full-screen', handleMaximized);
    window.electron.ipcRenderer.on('leave-full-screen', handleUnmaximized);
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
});
</script>