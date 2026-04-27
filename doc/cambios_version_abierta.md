# Cambios Jearcast V3.1 - Versión Abierta

Este documento detalla las modificaciones realizadas para transformar Jearcast de una versión restringida a una versión abierta para todo público.

## 1. Eliminación de Filtros de Contenido
Se han eliminado todas las restricciones de búsqueda y reproducción que limitaban el contenido a géneros específicos.
- **ContentFilterService.ts**: Pulido para permitir todo tipo de contenido. Los métodos `isForbidden` ahora siempre retornan `false` y `getExclusionQuery` retorna una cadena vacía.
- **YouTubeScraperService.ts**: Se eliminó la lógica que añadía términos de exclusión a las búsquedas de YouTube.
- **PlayerGlobalWidget.vue**: Se eliminó la verificación de seguridad que omitía canciones basándose en su título.
- **ArtistPickerWidget.vue**: Se eliminó el filtrado de canales de YouTube y se actualizaron los textos de la interfaz para ser más inclusivos ("Busca tus artistas favoritos").

## 2. Actualización de Artistas Recomendados
Se ha renovado la base de datos de artistas para incluir clásicos y éxitos modernos del Pop, Reggaeton, Rock y EDM.
- **artists-db.json**: Actualizado con artistas como Avicii, Bad Bunny, Daft Punk, Queen, Michael Jackson, Shakira, Coldplay, entre otros.
- **ArtistDiscoveryService.ts**: Se actualizaron las categorías de géneros similares (Pop, Reggaeton, Rock, EDM) para ofrecer recomendaciones coherentes con la nueva base de artistas.

## 3. Correcciones de Interfaz (UI/UX)
Se corrigió un problema visual detectado en navegadores basados en Chromium relacionado con el renderizado de bordes redondeados en los elementos Hero.
- **Páginas Afectadas**: `FavoritesPage.vue`, `PlayListPage.vue`, `RecommendedPage.vue`.
- **Solución**: Se reemplazó el uso de la propiedad abreviada `border-radius: 0 0 1rem 1rem` por las propiedades explícitas `border-bottom-left-radius: 1rem` y `border-bottom-right-radius: 1rem`.

## 4. Notas de Arquitectura
El sistema ahora es más ligero al no tener que procesar listas negras de términos durante las búsquedas, lo que mejora ligeramente el tiempo de respuesta en la visualización de resultados.
