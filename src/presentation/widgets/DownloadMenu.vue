<template>
    <div class="dropdown">
        <button class="btn btn-link p-0 text-white" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-three-dots-vertical fs-5"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-dark bg-dark border-secondary">
            <li>
                <a class="dropdown-item" href="#" @click.prevent="$emit('download', 'mp3')">
                    <i class="bi bi-file-music me-2 text-primary"></i>
                    MP3 (320kbps)
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="#" @click.prevent="$emit('download', 'm4a')">
                    <i class="bi bi-file-music me-2 text-info"></i>
                    M4A (AAC)
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="#" @click.prevent="$emit('download', 'webm')">
                    <i class="bi bi-file-music me-2 text-warning"></i>
                    WEBM (Opus)
                </a>
            </li>
            <li>
                <hr class="dropdown-divider border-secondary">
            </li>
            <li>
                <a class="dropdown-item" href="#" @click.prevent="$emit('download-all')">
                    <i class="bi bi-files me-2 text-success"></i>
                    Todas las calidades
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="#" @click.prevent="$emit('download-thumbnail')">
                    <i class="bi bi-image me-2 text-secondary"></i>
                    Solo portada
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="#" @click.prevent="$emit('download-metadata')">
                    <i class="bi bi-file-text me-2 text-light"></i>
                    Metadata
                </a>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
defineEmits<{
    (e: 'download', format: 'mp3' | 'm4a' | 'webm' | 'opus'): void
    (e: 'download-all'): void
    (e: 'download-thumbnail'): void
    (e: 'download-metadata'): void
}>()
</script>

<style scoped>
.dropdown-menu {
    min-width: 220px;
    margin-top: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.dropdown-item {
    font-size: 0.9rem;
    padding: 8px 16px;
    cursor: pointer;
}

.dropdown-item:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.dropdown-item i {
    width: 20px;
    text-align: center;
}
</style>