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

## 3. Mejoras Recientes (Sprint Actual)

### Diseño y Estética
- **Paleta Muted (Mate):** Se han desaturado los colores de acento en todos los temas para reducir la fatiga visual y enfocar la atención en el contenido (Minimalismo).
- **Border Radius:** Incremento de la curvatura en el video y componentes (18px) para un look más moderno y orgánico.

### Seguridad y Estabilidad
- **Integridad de Perfil:** Bloqueo del campo de correo electrónico en los ajustes para evitar inconsistencias en la autenticación de Firebase.
- **Registro Flexible:** Eliminación de la obligatoriedad de la API Key en el registro. Ahora el acceso es universal ("Fricción Cero"), permitiendo que usuarios novatos disfruten de la app mediante el modo de "Búsqueda Libre".

### Correcciones de Errores (Hotfixes)
- **Duplicidad de Declaraciones:** Corrección de errores de compilación en el componente de búsqueda.
- **Persistencia de Velo:** El blur ya no desaparece prematuramente al cambiar de canción desde el Miniplayer hacia el Fullscreen.

---

## 4. Medidas de Seguridad
- **Protección de Llaves:** Las API Keys se almacenan de forma segura en Firestore vinculadas al UID del usuario.
- **Validación Condicional:** La validación de servicios externos solo se dispara cuando hay datos presentes, evitando errores innecesarios durante el flujo de usuario.
- **Stream Bridge:** Sistema de recuperación para videos restringidos geográficamente, intentando reproducir via proxy o buscando espejos (mirrors) automáticamente.

---
**Desarrollado con enfoque en rendimiento, privacidad y estética minimalista.**
