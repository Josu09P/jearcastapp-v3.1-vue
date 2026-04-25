<template>
  <DashboardLayout>
    <div class="artists-page">
      <div class="page-header mb-4">
        <h2 class="page-title">
          <i class="bi bi-people-fill me-2" style="color: var(--accent-color) !important;"></i>
          Artistas
        </h2>
        <p class="page-subtitle">Explora y selecciona tus artistas favoritos de la iglesia adventista</p>
      </div>

      <div class="content-grid">
        <!-- Widget principal de selección de artistas -->
        <div class="artist-picker-container glass-card">
          <ArtistPickerWidget />
        </div>

        <!-- Sección de Mixes Generados (si hay) -->
        <div class="mixes-preview mt-5">
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h4 class="section-title text-white mb-0">
              <i class="bi bi-magic me-2 text-warning"></i>
              Mixes por Artista
            </h4>
          </div>
          <p class="text-secondary small mb-4">
            Genera mezclas personalizadas basadas en tus artistas favoritos. Los mejores temas de cada canal directamente para ti.
          </p>
          
          <!-- Aquí podríamos mostrar una vista previa o un mensaje motivador -->
          <div v-if="favoriteArtistsCount === 0" class="empty-state text-center p-5">
            <i class="bi bi-person-plus mb-3 d-block text-secondary" style="font-size: 3rem; opacity: 0.3;"></i>
            <h5>Aún no tienes artistas favoritos</h5>
            <p class="text-secondary">Selecciona algunos artistas arriba para poder generar mixes personalizados.</p>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'
import ArtistPickerWidget from '@/presentation/widgets/artists/ArtistPickerWidget.vue'
import { useArtistStore } from '@/stores/artist-store'

const artistStore = useArtistStore()
const favoriteArtistsCount = computed(() => artistStore.favoriteArtists.length)
</script>

<style scoped>
.artists-page {
  animation: fadeIn 0.5s ease;
}

.page-title {
  color: white;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.9rem;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 1.5rem;
}

.section-title {
  font-weight: 600;
  font-size: 1.25rem;
}

.empty-state {
  background: rgba(255, 255, 255, 0.02);
  border: 1px dashed rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
