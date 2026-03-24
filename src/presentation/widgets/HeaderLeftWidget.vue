<template>
  <div class="sidebar-wrapper">
    <div class="sidebar-nav">
      <!-- Logo y marca -->
      <div class="sidebar-header">
        <div class="brand" style="padding-bottom: 10px;">
          <div class="brand-icon">
            <img src="@/assets/img/logo-v3-icon.png" alt="App Icon" class="app-icon" />
          </div>
          <span class="brand-name" style="font-weight: bold;">JearCastMusic</span>
        </div>
      </div>

      <!-- Navegación principal -->
      <nav class="nav-menu">
        <div class="nav-section">
          <span class="nav-section-title">MENÚ</span>
          <ul class="nav-list">
            <li v-for="item in menuItems" :key="item.route" class="nav-item">
              <router-link class="nav-link" :class="{ 'active': $route.path === item.route }" :to="item.route">
                <i :class="`${item.icon}`"></i>
                <span>{{ item.label }}</span>
                <span v-if="$route.path === item.route" class="nav-indicator"></span>
              </router-link>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Footer de la sidebar -->
      <div class="sidebar-footer">
        <div class="version-info">
          <span style="font-size: 13px;"> © EasyPantry</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue';

const activeSection = inject('activeSection') as Ref<string>;
const changeSection = inject('changeSection') as (section: string) => void;

const menuItems = [
  { route: '/dashboard', label: 'Inicio', icon: 'bi bi-house-door' },
  { route: '/dashboard/favorites', label: 'Favoritos', icon: 'bi bi-heart' },
  { route: '/dashboard/play-list', label: 'Playlists', icon: 'bi bi-collection-play' },
  { route: '/dashboard/recommended', label: 'TopPicks', icon: 'bi bi-compass' },
  { route: '/dashboard/local-music', label: 'Música Local', icon: 'bi bi-mic' },
  { route: '/dashboard/settings', label: 'Ajustes', icon: 'bi bi-sliders2' }
]

const emit = defineEmits(['toggle-sidebar']);
const props = defineProps({
  isSidebarCollapsed: Boolean
});

function toggleSidebar() {
  emit('toggle-sidebar');
}
</script>

<style scoped>
.sidebar-wrapper {
  height: 100%;
  backdrop-filter: blur(12px);
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
}

/* Header */
.sidebar-header {
  padding: 0.97rem 1.25rem 0.1rem !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-icon {
  width: 22px;
  height: 46px;
  object-fit: contain;
  margin-left: 11px;
}

.brand-name {
  font-size: 1.3rem;
  font-weight: 600;
  background: linear-gradient(135deg, #fff, #1db954);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

/* Navigation */
.nav-menu {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.75rem;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.nav-section-title {
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.3);
  padding: 0 0.75rem;
  margin-bottom: 0.75rem;
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.nav-item {
  margin-bottom: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  position: relative;
}

.nav-link i {
  font-size: 1.2rem;
  width: 24px;
  transition: all 0.2s ease;
}

.nav-link span {
  flex: 1;
}

.nav-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #1db954;
  border-radius: 3px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: white;
}

.nav-link.active {
  background: rgba(29, 185, 84, 0.1);
  color: #1db954;
}

.nav-link.active i {
  color: #1db954;
}

/* Footer */
.sidebar-footer {
  padding: 1rem 1.25rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

.version-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.3);
}

.version-info i {
  font-size: 0.8rem;
}

/* Scrollbar personalizada */
.nav-menu::-webkit-scrollbar {
  width: 4px;
}

.nav-menu::-webkit-scrollbar-track {
  background: transparent;
}

.nav-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

.nav-menu::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Responsive - modo colapsado */
@media (max-width: 768px) {
  .sidebar-wrapper {
    width: 100%;
  }

  .brand-name {
    display: inline;
  }
}
</style>