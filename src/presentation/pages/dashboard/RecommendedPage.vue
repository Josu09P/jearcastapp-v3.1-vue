<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RecommendedPlaylistModel } from '@/domain/models/RecommendedPlaylistModel'
import type { RecommendedSongModel } from '@/domain/models/RecommendedSongModel'
import { fetchRecommendedPlaylistsService, fetchSongsFromRecommendedPlaylistService } from '@/data/services/firestore/RecommendedPlaylistFirestore'
import { usePlayerStore } from '@/stores/player-store'
import DashboardLayout from '@/presentation/layouts/DashboardLayout.vue'

const playlists = ref<RecommendedPlaylistModel[]>([])
const songs = ref<RecommendedSongModel[]>([])

const getLastRecommendedPlaylistId = (): string | null => {
    return localStorage.getItem('lastRecommendedPlaylistId')
}

const saveRecommendedPlaylistId = (playlistId: string) => {
    localStorage.setItem('lastRecommendedPlaylistId', playlistId)
}

const loadSongs = async (playlistId: string) => {
    saveRecommendedPlaylistId(playlistId)
    songs.value = await fetchSongsFromRecommendedPlaylistService(playlistId)
}

const playRecommended = (index: number) => {
    const selectedSong = songs.value[index]
    if (!selectedSong) return

    const videoList = songs.value.map(song => ({
        video_id: song.video_id,
        video_title: song.video_title,
        video_thumbnail: song.video_thumbnail
    }))

    const playerStore = usePlayerStore()
    playerStore.setPlaylist(videoList, index)
}

onMounted(async () => {
    playlists.value = await fetchRecommendedPlaylistsService()

    const lastPlaylistId = getLastRecommendedPlaylistId()
    if (lastPlaylistId) {
        await loadSongs(lastPlaylistId)
    }
})
</script>

<template>
    <DashboardLayout>
        <div class="container-fluid px-4 pt-3">
            <h4 class="text-white mb-2">Playlists Recomendadas</h4>
            <p class="text-light mb-3">JearCastApp te recomienda estas playlists.</p>

            <div class="d-flex overflow-auto gap-2 mb-4">
                <button v-for="playlist in playlists" :key="playlist.id" class="btn btn-outline-light flex-shrink-0"
                    style="min-width: 200px" @click="loadSongs(playlist.id)">
                    {{ playlist.name.replace(/_/g, ' ') }}
                </button>
            </div>

            <div class="text-white rounded shadow mt-4 container-player-jear" id="player-recommended-container"></div>

            <div v-if="songs.length > 0" class="container-scroll-wrapper-all mt-3 p-3 rounded">
                <div class="row">
                    <div v-for="(song, index) in songs" :key="song.video_id"
                        class="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                        <div class="card h-100 flex-row shadow-sm p-2 align-items-center video-card-custom">
                            <img :src="song.video_thumbnail" :alt="song.video_title" class="rounded-start me-3"
                                style="width: 120px; height: 80px; object-fit: cover" />
                            <div class="flex-grow-1 d-flex flex-column justify-content-between" style="min-width: 0;">
                                <h6 class="card-title text-truncate mb-1" :title="song.video_title"
                                    style="font-size: 0.85rem;">
                                    {{ song.video_title }}
                                </h6>
                                <div class="d-flex justify-content-center align-items-center mt-2">
                                    <button class="btn btn-sm btn-outline-danger" @click="playRecommended(index)">
                                        <i class="bi bi-play-circle"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="text-white p-4">Selecciona una playlist para ver sus canciones.</div>
        </div>
    </DashboardLayout>
</template>
