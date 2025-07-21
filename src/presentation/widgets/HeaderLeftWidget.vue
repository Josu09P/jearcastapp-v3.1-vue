<template>
  <div class="sidebar offcanvas-md offcanvas-start d-flex flex-column" tabindex="-1" id="sidebarMenu"
    aria-labelledby="sidebarMenuLabel">
    <div class="offcanvas-header">
      <h5 class="offcanvas-title text-white" id="sidebarMenuLabel">Menú</h5>
      <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas" data-bs-target="#sidebarMenu"
        aria-label="Close"></button>
    </div>

    <!-- Steel Music -->
    <div class="brand-box mx-3 my-2 text-center">
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

    <!-- Footer fijo abajo -->
    <div class="container-footer">
      <footer class="text-center text-light py-2 ">
        © 2025 JearCastApp
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
.sidebar {
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  background-color: rgba(178, 178, 178, 0.05);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.3rem;
  min-height: 98vh;
  margin-bottom: 100px !important;
}

.brand-box {
  background-color: rgba(255, 255, 255, 0.05);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.3rem;
  padding: 10px 0;
  margin-top: 20px !important;
  color: white;
}

.nav-link {
  border-radius: 1.3rem;
  border: 0.5px solid rgba(255, 255, 255, 0.1);
  padding: 10px 15px;
  margin: 5px 10px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
}

.nav-link i {
  font-size: 18px;
}

.nav-link.active {
  background-color: rgba(85, 85, 85, 0.367);
  border-left: 3px solid #ffffff;
  color: #fff;
}

.nav-link:hover:not(.active) {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
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
  font-family: 13px !important;
}
</style>
