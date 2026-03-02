<template>
  <div class="sidebar-content d-flex flex-column">
    <div class="offcanvas-header">
      <button type="button" class="btn-close btn-close-white d-md-none close-mobile-sidebar"
        @click="$emit('toggle-sidebar')" aria-label="Close">
      </button>

    </div>

    <!-- Logo -->
    <div class="brand-box mx-2 my-2 text-center">
      <span class="fs-5 fw-bold" style="color: white;">Steel Music</span>
    </div>
    <div class="offcanvas-body p-0 flex-grow-1">
      <nav class="navbar-dark p-3">
        <ul class="navbar-nav">
          <li class="nav-item" v-for="item in menuItems" :key="item.route">
            <router-link class="nav-link" :class="{ 'active': $route.path === item.route }" :to="item.route">
              <i :class="`${item.icon} me-2`"></i> {{ item.label }}
            </router-link>

          </li>
        </ul>
      </nav>
    </div>
    <!--FOOTER-->
    <div class="container-footer">
      <footer class="text-center text-light py-2">
        © 2025 EasyPantry
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, type Ref } from 'vue';

const activeSection = inject('activeSection') as Ref<string>;
const changeSection = inject('changeSection') as (section: string) => void;

const menuItems = [
  { route: '/dashboard', label: 'Inicio', icon: 'bi bi-house-door-fill' },
  { route: '/dashboard/favorites', label: 'Favoritos', icon: 'bi bi-heart-fill' },
  { route: '/dashboard/play-list', label: 'Play List', icon: 'bi bi-music-note-list' },
  { route: '/dashboard/recommended', label: 'Recomendados', icon: 'bi bi-stars' },
  //{ route: '/dashboard/local-music', label: 'Música Local', icon: 'bi bi-music-note-beamed' },
  { route: '/dashboard/themes', label: 'Colores', icon: 'bi bi-palette-fill' }
]

</script>

<style scoped>
.sidebar-content {
  margin-top: -3px !important;
  margin-left: -3px !important;
  margin-right: -3px !important;
  margin-bottom: -3px !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background-color: rgba(178, 178, 178, 0.05);
  border: none !important;
  min-height: 94.5vh;
  border-radius: 1.3rem;
  margin-bottom: 100px !important;
}

.brand-box {
  /*background-color: rgba(255, 255, 255, 0.05);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px; */
  padding: 10px 0;
  margin-top: 20px !important;
  color: white;
}

.nav-link {
  padding: 10px 15px;
  margin: 5px 10px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  border-radius: 1.0rem;
}

.nav-link i {
  font-size: 18px;
}

.nav-link.active {
  border-left: 2px solid #ffffff;
  border-radius: 1.0rem;
  filter: drop-shadow(1px 1px 2px rgb(228, 228, 228));
  color: #fff;
}

.nav-link:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 1.0rem;
}

.container-footer {
  border-radius: 1.3rem;
  padding: 15px;
}

form input::placeholder {
  color: rgba(255, 255, 255, 0.6);
}

footer {
  border-radius: 1.0rem;
  background-color: rgba(255, 255, 255, 0.05);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  padding: 5px;
  font-size: 13px !important;
}

@media (max-width: 768px) {
  .offcanvas-header .btn-close {
    position: absolute;
    background-color: #ffffff !important;
    border-radius: 1rem;
    padding: 5px;
    font-size: 12px;
    top: -5px;
    right: -5px;
    z-index: 9999;
  }
}
</style>
