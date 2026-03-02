<template>
  <div class="container-fluid container-all px-md-4">
    <Teleport to="body">
      <div class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }" id="sidebar">
        <HeaderLeftWidget @toggle-sidebar="toggleSidebar" />
      </div>
    </Teleport>
    <div class="main-content" :class="{ 'expanded': isSidebarCollapsed }" id="mainContent">
      <HeaderTopWidget @toggle-sidebar="toggleSidebar" />
      <main class="p-4">
        <slot></slot>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import HeaderTopWidget from '@/presentation/widgets/HeaderTopWidget.vue';
import HeaderLeftWidget from '@/presentation/widgets/HeaderLeftWidget.vue';

const isSidebarCollapsed = ref(false);

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
</script>

<style scoped>
/* ------------------------------- */
/* ESCRITORIO (Sidebar fijo)       */
/* ------------------------------- */
@media (min-width: 769px) {
  .sidebar {
    position: fixed;
    transition: all 0.3s ease;
    width: 230px;
    left: 10px;
    top: 42px;
    z-index: 1000;
  }

  .sidebar.collapsed {
    margin-left: -250px;
  }

  .main-content {
    transition: all 0.3s ease;
    margin-left: 250px;
    padding: 0;
    margin-top: 0;
  }

  .main-content.expanded {
    margin-left: 0 !important;
    width: 100% !important;
  }
}

/* ------------------------------- */
/* MÓVIL (Sidebar sobrepuesto)     */
/* ------------------------------- */
@media (max-width: 768px) {
  .sidebar {
    position: fixed !important;
    left: 0 !important;
    top: 0 !important;
    width: 240px !important;
    height: 100vh;
    z-index: 9999;
    border-radius: 0;
    margin: 10px 10px !important;
    transform: translateX(-260px);
    transition: transform 0.3s ease;
  }

  .sidebar.collapsed {
    transform: translateX(0);
  }

  /* El contenido no se mueve en móvil */
  .main-content,
  .main-content.expanded {
    margin-left: 0 !important;
    width: 100% !important;
    padding: 0;
  }

  /* Mover la X hacia abajo y a la derecha */
  .offcanvas-header .btn-close,
  .close-mobile-sidebar {
    position: absolute;
    top: 10px;
    right: 12px;
    z-index: 99999;
  }
}

/* ------------------------------- */
/* Otros estilos                   */
/* ------------------------------- */
.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.436);
}

.toggle-sidebar {
  background: transparent;
  border: none;
  color: #2c3e50;
  font-size: 1.5rem;
  cursor: pointer;
}
</style>
