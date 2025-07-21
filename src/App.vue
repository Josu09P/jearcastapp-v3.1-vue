<template>
  <router-view />
  <teleport to='body'>
    <PlayerGlobalWidget />
  </teleport>
</template>
<script setup lang="ts">
import PlayerGlobalWidget from './presentation/widgets/player/PlayerGlobalWidget.vue';

// This is the main entry point for the Vue application.
</script>