<template>
  <footer class="py-4 mt-auto text-dark">
    <div class="container">
      <div class="row text-center text-md-start">
        <!-- Columna 1: Logo y descripción -->
        <div class="col-md-4 mb-3">
          <img src="@/assets/img/logo-v3.png" alt="logo-page" width="100" style="filter: brightness(0) invert(1);">
          <p class="small mb-0">
            Escucha música desde YT con una interfaz moderna, inspirada en apps open source para escuchar muscica.
          </p>
        </div>

        <!-- Columna 2: Enlaces -->
        <div class="col-md-4 mb-3">
          <h6 class="fw-semibold">Enlaces útiles</h6>
          <ul class="list-unstyled">
            <li><a href="https://easypantry.netlify.app" class="text-decoration-none">EasyPantry</a></li>
            <li><a href="https://github.com/Josu09P/jearcastapp-v3.1-vue.git" class="text-decoration-none"
                target="_blank">Repositorio GitHub</a></li>
          </ul>
        </div>

        <!-- Columna 3: Contacto -->
        <div class="col-md-4 mb-3">
          <h6 class="fw-semibold">Contacto</h6>
          <ul class="list-unstyled">
            <li>
              <i class="bi bi-envelope me-2"></i>
              <a href="mailto:amazonjear4@gmail.com" class="text-decoration-none">Email</a>
            </li>
            <li>
              <i class="bi bi-cash-coin me-2"></i>
              <a href="https://paypal.me/Josu09P" target="_blank">Donar</a>
            </li>
          </ul>
        </div>
      </div>

      <hr class="border-secondary" />
      <div class="text-center small">
        © 2026 Desarrollado por EasyPantry.
      </div>
    </div>
  </footer>
</template>
<style scoped>
footer {
  margin-top: 40px !important;
  color: #f4f4f4 !important
}

a {
  color: #f4f4f4;
}
</style>