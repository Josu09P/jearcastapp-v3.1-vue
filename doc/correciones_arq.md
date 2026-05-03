1. El "Fuga Silenciosa" (Fundamento: Gestión de Memoria en Sesiones Largas)
  Aunque el scroll carga datos de forma controlada, el CacheService que vimos usa un Map interno.
   * El Riesgo: Si el usuario usa la app durante 5 o 10 horas seguidas, busca cientos de canciones o navega por muchas
     listas, ese Map en memoria nunca deja de crecer.
   * Fundamento: En ingeniería de software, un Map sin un límite de tamaño (MAX_SIZE) se considera una fuga de memoria
     potencial. Los elementos "expiran" en tiempo, pero el objeto sigue ocupando espacio en la RAM hasta que intentas
     acceder a él. Un límite de 100 o 200 elementos asegura que la app consuma exactamente la misma RAM en el minuto 1 que
     en la hora 10.

  2. Condiciones de Carrera (Fundamento: Idempotencia en la UI)
  Firebase es robusto, pero la lógica del componente puede ser "impaciente".
   * El Riesgo: Si un usuario hace clic en "Siguiente" muy rápido 5 veces, el watch de Vue dispara 5 peticiones casi
     simultáneas. Si la conexión de internet oscila, la petición #2 podría llegar después de la #5, causando que la lista
     de reproducción "salte" o se duplique.
   * Fundamento: Se busca la idempotencia (que la misma acción repetida no cause efectos secundarios inesperados). Bloquear
     una nueva petición hasta que la anterior termine (o usar un AbortController) garantiza que la interfaz siempre sea
     predecible.

  3. Reutilización vs. Destrucción (Fundamento: Ciclos de CPU y DOM)
  Actualmente, para cada canción de YouTube, haces esto: Destruir Iframe -> Crear Iframe nuevo -> Cargar API.
   * El Riesgo: Esto causa un pico de CPU y una pequeña "mancha blanca" o parpadeo. En dispositivos con pocos recursos,
     esto hace que la app se sienta pesada.
   * Fundamento: Los componentes de alto costo (como un Video Player o un Mapa) deben ser Singletons o reutilizables. Usar
     ytPlayer.loadVideoById() en lugar de new YT.Player() es como cambiar el disco en un reproductor en lugar de tirar el
     reproductor a la basura y comprar uno nuevo para cada canción.

---

### Cambios Realizados (Abril 2026)

Se han aplicado las siguientes correcciones arquitectónicas siguiendo las teorías confirmadas:

1. Gestión de Memoria en CacheService:
   * Cambio: Se añadió un límite MAX_SIZE = 200 al Map interno.
   * Lógica: Implementación de un desalojo tipo LRU (Least Recently Used) simple. Al insertar un elemento nuevo que excede el límite, se elimina automáticamente el más antiguo.
   * Resultado: Consumo de RAM predecible incluso en sesiones de uso prolongado.

2. Idempotencia y Control de Carrera en PlayerGlobalWidget:
   * Cambio: Introducción de un estado reactivo isChangingTrack (lock) y consolidación de observadores (watches).
   * Lógica: El watch de la canción actual ahora es atómico; gestiona la carga del reproductor, el historial de canciones y el reseteo de letras en una sola ejecución controlada. Se eliminaron 2 observadores redundantes.
   * Resultado: Navegación fluida, código unificado y garantía de que todos los efectos secundarios ocurren en el orden correcto.

3. Optimización del Reproductor (Singleton Pattern):
   * Cambio: Refactorización de createPlayer.
   * Lógica: En lugar de destroy() y new YT.Player(), ahora se utiliza ytPlayer.loadVideoById() si el objeto ya existe.
   * Resultado: Reducción drástica del uso de CPU durante transiciones, eliminación del parpadeo del iframe y carga de música notablemente más rápida.
