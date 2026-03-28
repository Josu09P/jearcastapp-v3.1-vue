<template>
    <div class="d-flex flex-column min-vh-100 home-welcome-page">
        <HeaderWidget />

        <main class="container fluid main-content">
            <section class="mb-5 text-center hero-section">
                <div
                    class="badge rounded-pill bg-primary bg-opacity-10 text-primary mb-3 px-3 py-2 border border-primary border-opacity-25">
                    Nueva Versión 1.1.2 - Disponible
                </div>
                <h1 class="display-4 fw-bold text-white mb-3">Descubre <span class="text-gradient">JearCast</span></h1>
                <p class="lead text-secondary mx-auto mb-5" style="max-width: 800px;">
                    La evolución de la música open source. Una experiencia de escritorio <strong>sin anuncios</strong>,
                    potenciada por tu propia API Key para un control total y una velocidad inigualable.
                </p>

                <div class="row g-3 mb-5 text-start">
                    <div class="col-md-4" v-for="feature in features" :key="feature.title">
                        <div class="feature-card h-100">
                            <i :class="feature.icon + ' text-primary fs-3 mb-3 d-block'"></i>
                            <h3 class="h6 fw-bold text-white mb-2">{{ feature.title }}</h3>
                            <p class="small text-muted mb-0">{{ feature.desc }}</p>
                        </div>
                    </div>
                </div>
            </section>

            <div class="row g-4">
                <div class="col-lg-5">
                    <section class="h-100">
                        <div class="card h-100 shadow-lg border-0 bg-glass text-light hover-up">
                            <div class="card-body d-flex flex-column p-4">
                                <div class="icon-box mb-3">
                                    <i class="bi bi-rocket-takeoff fs-2"></i>
                                </div>
                                <h2 class="h4 mb-3 fw-bold">Comienza Ahora</h2>
                                <p class="opacity-75 small">
                                    Configura tu API Key en pocos pasos con esta guía visual optimizada para 2026.
                                </p>
                                <a href="/assets/pdf/guia_app_jearcast.pdf"
                                    class="btn btn-primary btn-lg mt-auto shadow-sm w-100" download>
                                    <i class="bi bi-file-pdf-fill me-2"></i> Descargar
                                </a>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="col-lg-7">
                    <section class="h-100">
                        <div class="card h-100 shadow-lg border-0 bg-glass text-light">
                            <div class="card-body p-4">
                                <div class="row align-items-center">
                                    <div class="col-md-7">
                                        <h2 class="h4 mb-4 fw-bold border-start border-primary border-4 ps-3">Apoya el
                                            Desarrollo</h2>

                                        <div class="donation-list">
                                            <div class="donation-item">
                                                <span class="badge-custom yape">Yape</span>
                                                <span class="fw-mono">965634940</span>
                                            </div>
                                            <div class="donation-item">
                                                <span class="badge-custom visa">Visa CCI</span>
                                                <span class="fw-mono small">00389801341325477041</span>
                                            </div>
                                            <div class="donation-item">
                                                <span class="badge-custom visa">Visa CCI</span>
                                                <span class="fw-mono small">92200300000220819095</span>
                                            </div>
                                            <div class="donation-item">
                                                <span class="badge-custom visa">Visa CCI</span>
                                                <span class="fw-mono small">00233519455928804785</span>
                                            </div>
                                            <div class="mt-3">
                                                <a href="https://paypal.me/Josu09P" target="_blank" class="paypal-btn">
                                                    <i class="bi bi-paypal me-2"></i>Paypal: Josue Algarate
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="col-md-5 d-none d-md-flex justify-content-center">
                                        <div class="video-wrapper">
                                            <video class="rounded-circle shadow-lg" width="200" height="200"
                                                style="object-fit: cover;" autoplay loop muted playsinline>
                                                <source src="@/assets/vid/tanks-cat.mp4" type="video/mp4" />
                                            </video>
                                        </div>
                                    </div>
                                </div>
                                <div
                                    class="mt-4 pt-3 border-top border-white border-opacity-10 d-flex justify-content-between align-items-center">
                                    <span class="small text-muted"><i
                                            class="bi bi-envelope me-2"></i>jearcast@gmail.com</span>
                                    <span class="fw-bold small text-primary">¡Gracias por tu apoyo!</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div class="col-12 mt-5">
                    <section>
                        <div class="card shadow-lg border-0 bg-glass text-light p-4">
                            <h2 class="h4 mb-4 fw-bold text-center">Muro
                                de
                                Donantes
                            </h2>
                            <div class="row g-3 justify-content-center">
                                <div class="col-6 col-md-3 col-lg-2 text-center" v-for="donor in donors"
                                    :key="donor.name">
                                    <div class="donor-card py-3 px-2 rounded-4">
                                        <div class="donor-avatar mb-2 mx-auto">
                                            <i class="bi bi-person-circle fs-3 text-primary shadow-sm"></i>
                                        </div>
                                        <div class="small fw-bold text-white">{{ donor.name }}</div>
                                        <div class="extra-small text-info">{{ donor.amount }}</div>
                                    </div>
                                </div>
                                <div v-if="donors.length === 0" class="text-center opacity-50 py-3">
                                    <p class="mb-0">¡Si te gustó apoya el desarrollo de esta App!</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
        <FooterComponent />
    </div>
</template>

<script setup lang="ts">
import HeaderWidget from '@/presentation/widgets/HeaderWidget.vue'
import FooterComponent from '@/presentation/widgets/FooterWidget.vue'

const features = [
    { icon: 'bi-cloud-arrow-down', title: 'Descargas', desc: 'Guarda tu música favorita offline.' },
    { icon: 'bi-music-note-list', title: 'Letras Sincronizadas', desc: 'Sigue el ritmo con letras en tiempo real.' },
    { icon: 'bi-play-circle', title: 'Reproductor Intuitivo', desc: 'Interfaz minimalista y potente.' },
    { icon: 'bi-palette', title: 'Temas Personalizados', desc: 'Adapta la app a tu estilo visual.' },
    { icon: 'bi-shield-check', title: 'Sin Anuncios', desc: 'Escucha sin interrupciones molestas.' },
    { icon: 'bi-sliders', title: 'Configuración Pro', desc: 'Ajustes avanzados a tu medida.' }
]

// Lista de donantes (puedes agregar los nombres reales aquí)
const donors = [
    { name: 'Usuario Anon.', amount: '$5.00' },
    { name: 'Fan de JearCast', amount: '$10.00' },
    { name: 'Colaborador', amount: '$20.00' },
]
</script>

<style scoped>
/* Estilos anteriores se mantienen exactamente igual */
.home-welcome-page {
    background-color: rgb(1, 40, 80);
    background-image: radial-gradient(at 0% 0%, rgba(58, 123, 213, 0.15) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(0, 210, 255, 0.1) 0px, transparent 50%);
    padding-top: 60px;
}

.main-content {
    background: rgba(30, 41, 59, 0.5);
    padding: 50px;
    border-radius: 30px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.feature-card {
    background: rgba(255, 255, 255, 0.03);
    padding: 20px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s ease;
}

.feature-card:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-3px);
    border-color: rgba(58, 123, 213, 0.4);
}

.text-gradient {
    background: linear-gradient(135deg, #60a5fa, #2563eb);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.bg-glass {
    background: rgba(15, 23, 42, 0.6);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.donation-item {
    background: rgba(2, 6, 23, 0.4);
    padding: 10px 15px;
    border-radius: 12px;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.03);
}

.badge-custom {
    font-size: 0.7rem;
    padding: 4px 8px;
    border-radius: 6px;
    margin-right: 12px;
    font-weight: bold;
    text-transform: uppercase;
}

.yape {
    background: #8e24aa;
    color: white;
}

.visa {
    background: #1a1f71;
    color: white;
}

.paypal-btn {
    display: inline-block;
    background: #0070ba;
    color: white;
    padding: 10px 20px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: bold;
    width: 100%;
    text-align: center;
    transition: opacity 0.2s;
}

.paypal-btn:hover {
    color: white;
    opacity: 0.9;
}

.video-wrapper {
    position: relative;
    padding: 10px;
    background: linear-gradient(45deg, #2563eb, transparent);
    border-radius: 10%;
}

.fw-mono {
    font-family: 'Monaco', 'Consolas', monospace;
    color: #94a3b8;
}

p {
    color: white !important;
}

/* ESTILOS NUEVOS PARA DONANTES */
.donor-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: background 0.3s;
}

.donor-card:hover {
    background: rgba(255, 255, 255, 0.1);
}

.donor-avatar {
    width: 45px;
    height: 45px;
    background: rgba(37, 99, 235, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.extra-small {
    font-size: 0.7rem;
    font-weight: bold;
}

@media (max-width: 768px) {
    .main-content {
        padding: 25px;
        margin: 15px;
    }
}
</style>