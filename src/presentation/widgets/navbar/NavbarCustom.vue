<template>
    <div class="custom-navbar">
        <div class="left-section">
            <img src="@/assets/img/logo-v4.png" alt="App Icon" class="app-icon" />
            <span class="app-title">V.1.1</span>
        </div>

        <div class="right-section">
            <button class="window-btn" title="Minimizar" @click="minimizeWindow">
                <i class="bi bi-dash" style="font-size: 16px;"></i>
            </button>
            <button class="window-btn" title="Maximizar/Restaurar" @click="toggleMaximize">
                <i class="bi bi-square" style="font-size: 10px;"></i>
            </button>
            <button class="window-btn close" title="Cerrar" @click="closeWindow">
                <i class="bi bi-x-lg" style="font-size: 12px;"></i>
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
const ipc = window.electron?.ipcRenderer

function minimizeWindow() {
    ipc?.send('window-minimize')
}

function toggleMaximize() {
    ipc?.send('window-toggle-maximize')
}

function closeWindow() {
    ipc?.send('window-close')
}
</script>


<style scoped>
.custom-navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 10px;
    z-index: 9999;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    -webkit-app-region: drag;
    user-select: none;
}

.left-section {
    display: flex;
    align-items: center;
    gap: 8px;
}

.app-icon {
    width: 12px;
    height: 12px;
    object-fit: contain;
    filter: brightness(0) invert(1);
}

.app-title {
    color: #ffffff;
    font-size: 10px;
    font-weight: 600;
}

.right-section {
    display: flex;
    gap: 6px;
    -webkit-app-region: no-drag;
    /* Permite hacer clic en los botones */
}

.window-btn {
    background: transparent;
    border: none;
    color: white;
    padding: 4px 10px;
    font-size: 14px;
    border-radius: 4px;
    transition: background 0.2s;
}

.window-btn:hover {
    background: rgba(255, 255, 255, 0.2);
}

.window-btn.close:hover {
    background: #e74c3c;
}
</style>
