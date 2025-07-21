<template>
    <div class="d-flex flex-column min-vh-100 home-welcome-page">
        <HeaderWidget />

        <main class="container mt-3">
            <!-- Botón de saltar -->
            <div class="text-end mb-4">

            </div>

            <!-- Sección de bienvenida -->
            <section class="mb-5 text-center">
                <h1 class="display-5 fw-bold text-light">Bienvenido a JearCast</h1>
                <p class="lead text-light">
                    JearCast es una aplicación de escritorio para Linux que permite
                    escuchar música desde YouTube usando tu propia API Key. Diseñada
                    para brindarte una experiencia moderna, rápida y sin interrupciones,
                    similar a Spotify.
                </p>
            </section>

            <!-- Sección: Guía -->
            <section class="mb-5">
                <div class="card shadow-sm border-0 bg-glass text-light">
                    <div class="card-body">
                        <h2 class="h4 mb-3">📄 Guía para usar JearCast</h2>
                        <p>
                            Hemos preparado un documento completo con todos los pasos necesarios para obtener tu API
                            Key, configurar tu cuenta y comenzar.
                        </p>
                        <a href="/assets/pdf/guia_app_jearcast.pdf" class="btn btn-primary" download>
                            <i class="bi bi-file-earmark-arrow-down"></i> Descargar Guía (PDF)
                        </a>
                    </div>
                </div>
            </section>

            <!-- Sección: Apoyar -->
            <section class="mb-5">
                <div class="card shadow-sm border-0 bg-glass text-light">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <h2 class="h4 mb-3">🤝 Apoya al desarrollador</h2>
                                <p>
                                    Si este proyecto te gusta o te resulta útil, puedes apoyar su desarrollo:
                                </p>
                                <ul class="list-unstyled">
                                    <li><strong>Yape:</strong> 987 654 321</li>
                                    <li><strong>BCP:</strong> 33594559288047 <small>(N° cuenta)</small></li>
                                    <li>
                                        <strong>Paypal:</strong>
                                        <a href="https://paypal.me/Josu09P" target="_blank" class="text-success">
                                            paypal.me/Josu09P (Josue Algarate Rubio)
                                        </a>
                                    </li>
                                    <li><strong>Contacto:</strong> jearcast@gmail.com</li>
                                </ul>
                                <p class="small mt-3">¡Gracias por ser parte de la comunidad Linuxera! 🐧🎶</p>
                            </div>

                            <div class="col-md-4 d-flex justify-content-center">
                                <video class="rounded shadow" width="300" autoplay loop muted playsinline>
                                    <source src="@/assets/vid/tanks-cat.mp4" type="video/mp4" />
                                    Tu navegador no soporta video HTML5.
                                </video>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
        <FooterComponent />
    </div>
</template>

<script setup lang="ts">
import HeaderWidget from '@/presentation/widgets/HeaderWidget.vue'
import FooterComponent from '@/presentation/widgets/FooterWidget.vue'
</script>

<style scoped>
.home-welcome-page {
    background-image: url('@/assets/img/bg-hero.png');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-color: #102c4a;
}

main.container {
    background-color: rgba(118, 118, 118, 0.3);
    padding: 20px;
    border-radius: 8px;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}

.bg-glass {
    background-color: rgba(107, 107, 107, 0.52);
    border-radius: 1rem;
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}
</style>
