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
import { provide, ref } from 'vue';
import HeaderTopWidget from '@/presentation/widgets/HeaderTopWidget.vue';
import HeaderLeftWidget from '@/presentation/widgets/HeaderLeftWidget.vue';

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
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--main-bg-color);
  background-attachment: fixed;
  overflow-x: hidden;
}

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 260px;
  height: 100vh;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1000;
}

.sidebar.collapsed {
  transform: translateX(-260px);
}

.main-content {
  flex: 1;
  margin-left: 260px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  width: calc(100% - 260px);
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

/* ==================== RESPONSIVE COMPLETO ==================== */

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
    transform: translateX(-260px);
    background: transparent;
    backdrop-filter: blur(32px);
  }

  .sidebar.collapsed {
    transform: translateX(0);
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