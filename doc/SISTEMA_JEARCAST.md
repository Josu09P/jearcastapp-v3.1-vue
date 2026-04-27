# DOCUMENTACIÓN DEL PROYECTO: JEARCAST V3.1

## Descripción General
JearCast es una plataforma de streaming de música diseñada exclusivamente para la comunidad Cristiana Adventista. Combina la potencia del contenido global de YouTube con la gestión de bibliotecas locales, todo bajo un entorno de diseño moderno y seguro.

## Filosofía de Contenido (Filtro Sagrado)
La aplicación integra un ContentFilterService robusto que actúa como guardián del contenido.
- Bloqueo de géneros: Reguetón, Pop, Rock, Jazz, Rap, Trap, y géneros urbanos.
- Inteligencia de filtrado: Uso de límites de palabra (\b) para permitir términos naturales como "popular" o "amor", pero bloqueando el género "pop".
- Lista Blanca: Términos como "Adventista", "Iglesia", "Himno", e "IASD" permiten que el contenido pase el filtro incluso si el algoritmo de YouTube lo clasifica erróneamente.

## Arquitectura Técnica
- Frontend: Vue 3 (Composition API) + Vite.
- Estado: Pinia (Store centralizado para Usuario, Artistas, Música Local y Reproductor).
- Persistencia: Firebase Firestore (Favoritos, Playlists) y LocalStorage (Configuración, Caché de Mixes).
- Integración Desktop: Electron a través de un puente IPC (Inter-Process Communication).

## Módulos Principales
1. Reproductor Global (Unified Player):
   - Motor híbrido: Alterna entre Iframe de YouTube y Motor de Audio Local.
   - Sistema Tabula Rasa: Al cambiar de motor, destruye completamente el DOM y el player anterior para evitar bugs de pantalla completa o fugas de memoria.
   - Protocolo de Recuperación: En caso de restricción por copyright, el sistema intenta automáticamente un "Stream Bridge" o busca un "Espejo" (Mirror) de la canción.

2. Gestión de Artistas:
   - Bloque de Favoritos: Sincronizado con Firestore.
   - Bloque de Descubrimiento: Buscador de canales oficiales de YouTube.
   - Bloque de Mixes: Generación automática de listas de reproducción basadas en los artistas seguidos por el usuario.

3. Música Local:
   - Acceso directo al sistema de archivos mediante Electron.
   - Extracción de metadatos (Título, Artista, Portada).

## Funcionalidades a Futuro
- Modo Offline real: Descarga y encriptación de archivos para uso sin internet.
- Sincronización con Himnario: Integración de letras y partituras de los himnarios oficiales.
- Radio en Vivo: Estaciones de radio adventistas integradas.
- Análisis de Vibe: Sugerencia de música basada en el momento del día (Sábado, Oración, Estudio).

## Recordatorios Críticos
- Notificaciones: No usar emojis en las notificaciones Toast o SweetAlert. Mantener un tono profesional y limpio.
- Memoria: Siempre limpiar los timers y listeners en el hook onBeforeUnmount de los componentes.
- Redimensionamiento: El Iframe debe ser líquido y ocupar el 100% de su contenedor wrapper.
