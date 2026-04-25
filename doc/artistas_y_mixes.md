# Módulo de Artistas y Mixes Personalizados

## Descripción
Este módulo se encarga de la gestión de artistas favoritos (específicamente enfocados en la Iglesia Adventista) y la generación de mezclas (mixes) personalizadas basadas en dichos artistas.

## Cambios Recientes
- **Base de Datos de Artistas**: Se ha actualizado `src/data/host-db/artists-db.json` para incluir exclusivamente artistas y canales adventistas reconocidos (Arautos do Rei, Heritage Singers, Felipe Garibo, etc.).
- **Nueva Página de Artistas**: Se ha creado `src/presentation/pages/dashboard/ArtistsPage.vue` como un espacio dedicado para buscar y seleccionar artistas.
- **Optimización de Búsqueda**: Se ha eliminado la precarga de imágenes de artistas populares en el inicio para evitar llamadas excesivas a la API/Scraping de YouTube.
- **Distribución de Responsabilidades**: 
    - La página de **Inicio** muestra los mixes ya generados.
    - La página de **Artistas** permite la búsqueda, selección y generación manual de nuevos mixes.

## Funcionamiento Técnico

### 1. Gestión de Artistas (`ArtistPickerWidget.vue`)
- El componente muestra una lista de artistas locales (desde el JSON) y permite buscar nuevos artistas en YouTube.
- **Optimización**: No se buscan miniaturas al iniciar a menos que el artista sea favorito.
- Al seleccionar un artista, este se guarda en Firestore (via `ArtistStore`).

### 2. Generación de Mixes
- Se utiliza `GenerateArtistMixesUseCase` para analizar los artistas favoritos del usuario.
- Por cada artista, se buscan temas populares (vía scraping ético) y se crea un `MixModel`.
- Los mixes se guardan en el `localStorage` para persistencia y para evitar re-generaciones innecesarias.

### 3. Visualización de Mixes (`MixWidget.vue`)
- El widget de la página de inicio carga primero desde el caché.
- Si no hay caché o se solicita una actualización, realiza el análisis y búsqueda.

## Flujo de Trabajo Sugerido para el Usuario
1. El usuario navega a la sección **Artistas**.
2. Selecciona sus artistas favoritos de la lista adventista o busca nuevos.
3. Presiona **Generar Mix** para crear mezclas personalizadas.
4. En la página de **Inicio**, aparecerán estos mixes listos para ser reproducidos.
