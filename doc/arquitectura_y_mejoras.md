# Reporte Técnico: Arquitectura y Mejoras de JearCast App v3.1

Este documento detalla la estructura del sistema, la arquitectura implementada y las correcciones recientes para garantizar una experiencia de usuario premium y una base de código escalable.

---

## 1. Arquitectura del Sistema (Clean Architecture)

La aplicación sigue los principios de **Clean Architecture**, dividiendo la lógica en capas para facilitar el mantenimiento y la independencia de tecnologías externas.

### A. Capa de Presentación (Presentation)
- **Tecnología:** Vue 3 (Composition API) + Pinia (State Management).
- **Widgets:** Componentes reutilizables como el `PlayerGlobalWidget`, `MusicSearchOverlay` y `LyricsDisplay`.
- **Layouts:** Estructura base como `DashboardLayout` que mantiene la persistencia visual del reproductor durante la navegación.
- **Lógica de UI:** Gestión de temas dinámicos, transiciones de video y animaciones Lottie.

### B. Capa de Dominio (Domain)
- **Modelos:** Definición de interfaces de datos (`Track`, `UserModel`, `PlayListModel`) que dictan cómo se estructura la información en toda la app.
- **Casos de Uso (Use Cases):** Lógica de negocio pura e independiente del framework. Ejemplos:
    - `AddFavoriteMusic`: Orquesta la validación y el guardado de favoritos.
    - `UpdateUserUseCase`: Gestiona la integridad de los datos del perfil.
    - `AnalyzeFavoritesUseCase`: Motor de recomendaciones basado en el gusto del usuario.

### C. Capa de Datos (Data)
- **Servicios:** Implementaciones concretas de acceso a datos externos.
    - **Firebase/Firestore:** Almacenamiento de usuarios, playlists y favoritos.
    - **YouTubeScraperService:** Motor de extracción de datos de YouTube sin necesidad de API Keys (Búsqueda Libre).
    - **LocalAudioService:** Gestión de archivos de audio locales y streams directos.
- **Repositories:** Actúan como intermediarios entre los servicios y los casos de uso.

---

## 2. Funcionalidades Críticas y Sincronización

### Reproductor Inteligente (Smart Player)
- **Velo de Privacidad (Video Veil):** Un overlay con desenfoque (blur) dinámico que oculta la interfaz nativa de YouTube durante momentos críticos (inicio de canción, carga de internet o final de pista) para mantener la estética minimalista.
- **Manejo de Seek & Buffer:** Sincronización de la barra de progreso con el estado del reproductor para evitar congelamientos durante el desplazamiento del tiempo.

### Motor de Búsqueda Híbrido
- **Failover Automático:** El sistema intenta primero la búsqueda oficial vía API Key (para mayor precisión y estadísticas). Si no hay llaves disponibles o se agota la cuota, el sistema conmuta instantáneamente al **Scraper**, garantizando que el usuario nunca pierda la capacidad de búsqueda.
- **Multi-Key Management:** Soporte para múltiples API Keys con rotación automática en caso de errores de cuota.

---

### 3. Mejoras Recientes (Mayo 2026)

#### Optimización de Código y Arquitectura
- **Refactorización de PlayerGlobalWidget:** El componente central (reproductor) ha sido descompuesto en composables especializados (`useYouTubePlayer`, `useLocalAudioPlayer`, `usePlayerUI`, `useDiscovery`). Esto redujo el tamaño del archivo `.vue` y mejoró la separación de responsabilidades.
- **Limpieza de Estilos (CSS):** Centralización de estilos en `player-styles.css`, eliminando el bloque `<style scoped>` masivo del componente. Se optimizó el redimensionamiento del Iframe mediante ráfagas de reflujo controladas.
- **Mitigación de Errores de Concurrencia:** Implementación de un lock de estado de error (`lastErrorId`) para evitar alertas persistentes y bucles de recuperación infinitos ante fallos de red o copyright.

#### Seguridad y Estabilidad
- **Prevención de Duplicados:** Implementación de un estado de carga (`isProcessing`) en la selección de artistas favoritos para evitar entradas duplicadas por clics accidentales.
- **Tipado Estricto:** Introducción de definiciones de tipos globales para la API de YouTube (`src/youtube.d.ts`).


---

## 4. Medidas de Seguridad
- **Protección de Llaves:** Las API Keys se almacenan de forma segura en Firestore vinculadas al UID del usuario.
- **Validación Condicional:** La validación de servicios externos solo se dispara cuando hay datos presentes, evitando errores innecesarios durante el flujo de usuario.
- **Stream Bridge:** Sistema de recuperación para videos restringidos geográficamente, intentando reproducir via proxy o buscando espejos (mirrors) automáticamente.

---

## 5. Módulo de Artistas Adventistas (Optimización de Recursos)

### Enfoque de Contenido
- **Curaduría:** La base de datos de artistas ha sido migrada para enfocarse exclusivamente en el ecosistema musical de la Iglesia Adventista del Séptimo Día (SDA).
- **Base de Datos Local:** Integración de `artists-db.json` para proporcionar una lista de canales verificados sin necesidad de consultas iniciales al servidor.

### Optimizaciones de Rendimiento
- **Lazy Loading de Imágenes:** Se eliminó la precarga de miniaturas (thumbnails) de artistas sugeridos. Ahora el sistema solo busca metadatos enriquecidos (vía IPC Electron) cuando el usuario marca un artista como favorito o realiza una búsqueda explícita.
- **Arquitectura de Mixes:** 
    - **Productor (ArtistsPage):** Centraliza la búsqueda y generación de mezclas.
    - **Consumidor (HomePage):** Muestra los resultados cacheados, evitando la regeneración constante de playlists que consume cuotas de red y procesamiento.

---
**Desarrollado con enfoque en rendimiento, privacidad y estética minimalista.**
