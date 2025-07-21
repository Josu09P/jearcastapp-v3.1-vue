<template>
  <nav class="navbar navbar-expand-lg" style="padding: 0 40px;margin-bottom: 20px;">
    <div class="container-fluid justify-content-between">
      <span class="navbar-text text-light fw-semibold">
        <img src="@/assets/img/logo-v3.png" alt="logo-page" width="100" style="filter: brightness(0) invert(1);" />
      </span>

      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarWelcome"
        aria-controls="navbarWelcome" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse justify-content-end" id="navbarWelcome">
        <ul class="navbar-nav">
          <router-link to="/auth/login" class="btn btn-outline-primary btn-sm text-light">
            Saltar todo esto e iniciar sesión →
          </router-link>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
nav {
  color: #f4f4f4 !important;
}
</style>
