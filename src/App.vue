<template>
  <NavbarCustom />
  <span style="margin-bottom: 20px;"></span>
  <router-view />
  <teleport to='body'>
    <PlayerGlobalWidget />
  </teleport>
</template>
<script setup lang="ts">
import NavbarCustom from './presentation/widgets/navbar/NavbarCustom.vue';
import PlayerGlobalWidget from './presentation/widgets/player/PlayerGlobalWidget.vue';
</script>