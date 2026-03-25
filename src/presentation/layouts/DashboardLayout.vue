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
}

/* Sidebar */
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

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content.expanded {
  margin-left: 0;
}

.content-area {
  flex: 1;
  padding: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-260px);
  }

  .sidebar.collapsed {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }
}
</style>