<template>
  <div class="container-fluid container-all">
    <div class="sidebar" :class="{ 'collapsed': isSidebarCollapsed }" id="sidebar">
      <HeaderLeftWidget @toggle-sidebar="toggleSidebar" />
    </div>
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
.container-all {
  padding-top: 42px;
  padding-left: 10px !important;
  padding-right: 10px !important;
  padding-bottom: 10px !important;
  background: var(--main-bg-color);
  background-image: url("@/assets/img/bg-hero.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.sidebar {
  position: fixed;
  color: white;
  transition: all 0.3s;
  width: 230px;
  margin-bottom: 10px !important;
}

.sidebar.collapsed {
  margin-left: -250px;
}

.main-content {
  transition: all 0.3s;
  width: calc(100% - 250px);
  float: right;
  padding: 0;
  margin: 0;
}

.main-content.expanded {
  width: 100%;
}

.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-sidebar {
  background: none;
  border: none;
  color: #2c3e50;
  font-size: 1.5rem;
  cursor: pointer;
}
</style>
