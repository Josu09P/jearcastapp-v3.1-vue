# PROMPT MEJORADO DE INICIALIZACIÓN DE AGENTE REINICIADO - JEARCAST V3.1

Si estás leyendo esto, acabas de ser reiniciado para trabajar en JearCast V3.1. Para actuar con precisión y eficacia, sigue este resumen ejecutivo del estado actual del sistema:

## 1. Contexto y Filosofía
- Propósito: Aplicación de streaming de música que combina YouTube con bibliotecas locales.
- Estado Actual: Actualmente en Versión Abierta. Se han desactivado los filtros religiosos (Filtro Sagrado) y se ha ampliado la base de datos de artistas a géneros populares (Pop, Rock, Reggaeton).
- Documentación Clave: 
  - doc/SISTEMA_JEARCAST.md: Filosofía original (Adventista).
  - doc/cambios_version_abierta.md: Detalle de la transición a versión abierta.
  - doc/arquitectura_y_mejoras.md: Reporte técnico de arquitectura.

## 2. Arquitectura (Clean Architecture)
- Frontend (Vue 3 + Vite + Pinia):
  - src/presentation/: Capa de UI (Widgets, Pages, Layouts).
  - src/domain/: Lógica de negocio pura (Models, Use Cases).
  - src/data/: Implementaciones de servicios (Firestore, YouTube, Local Storage).
- Backend (Electron):
  - Proporciona acceso a archivos locales, descargas y controles de ventana.
  - Comunicación vía IPC (src/electron.d.ts).

## 3. Conceptos Técnicos Críticos
- Motor Híbrido: Alterna entre Iframe de YouTube y audio local. 
- Tabula Rasa: Al cambiar de motor, se limpia el DOM para evitar fugas y bugs visuales.
- Video Veil (Velo): Desenfoque dinámico sobre el video para ocultar la interfaz nativa de YouTube.
- Failover de Búsqueda: Intenta primero con API Key de YouTube; si falla, usa el YouTubeScraperService.
- Caché Inteligente: CacheService con límite de 200 elementos y desalojo LRU.

## 4. Estándares de Ingeniería
- Prohibición de Emojis: No agregar emojis a ningún mensaje, texto de sección del proyecto, notificaciones o documentación. Solo texto plano para mantener un tono profesional.
- Ética: Respetar el scraping ético y no violar términos de servicios externos.
- Estética: Minimalismo Muted (Mate), border-radius de 18px.
- Rendimiento: Limpiar listeners en onBeforeUnmount, usar Singleton para el reproductor (loadVideoById).

## 5. Directorios de Interés
- src/data/host-db/artists-db.json: Lista de artistas recomendados.
- src/data/services/audio/ContentFilterService.ts: Lógica de filtrado (actualmente abierta).
- src/stores/: Estado centralizado (Player, User, Artists).

Instrucción Final: Antes de realizar cualquier cambio, verifica si afecta la Versión Abierta o si se busca regresar a la Versión Adventista. Siempre consulta doc/correciones_arq.md para evitar introducir regresiones en la gestión de memoria o condiciones de carrera.
