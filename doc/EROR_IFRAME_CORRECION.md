# REPORTE TÉCNICO: CORRECCIÓN DE TAMAÑO Y RECUPERACIÓN DEL IFRAME

Este documento detalla el análisis y la solución del error recurrente donde el Iframe de YouTube perdía sus dimensiones originales y bloqueaba la interfaz tras detectar contenido con restricciones de derechos de autor (copyright).

## 1. Análisis del Problema (Causas Raíz)

### A. Corrupción de Estilos Internos de YouTube
Cuando YouTube detecta que un video no puede reproducirse (error 101/150), el Iframe inyecta dinámicamente estilos CSS internos y cambia su estructura DOM para mostrar el aviso de restricción. 
- El sistema anterior intentaba reutilizar la instancia del reproductor (`loadVideoById`) para la siguiente canción para ahorrar recursos (Singleton Pattern).
- Resultado: Los estilos de "error" de YouTube persistían en el objeto, impidiendo que el Iframe recuperara su tamaño completo (100% width/height) en pistas posteriores.

### B. Desincronización del Estado de Recuperación
Al fallar YouTube, se activaba el "Stream Bridge" (audio alternativo). Sin embargo:
- El velo (blur) no se eliminaba, dejando la interfaz bloqueada visualmente.
- Los botones de Play/Pause no se sincronizaban con el motor de audio local, mostrando un estado de "pausado" perpetuo.
- La persistencia del ID de error bloqueaba intentos de reproducción legítimos en canciones siguientes.

---

## 2. Solución Implementada

### A. Protocolo de Hard Reset (Recreación Atómica)
Se implementó una bandera de estado `hasError` en el composable `useYouTubePlayer`.
- Lógica: Si una canción termina en error, la función `createPlayer` detecta que el entorno está "corrupto".
- Acción: En lugar de reutilizar el objeto, el sistema ejecuta una destrucción total (`ytPlayer.destroy()`) y limpia el contenedor del DOM antes de instanciar un nuevo Iframe.
- Impacto: Esto garantiza que cada canción exitosa inicie con un entorno CSS limpio y dimensiones máximas.

### B. Sincronización Maestra del Motor Híbrido
Se ajustó el Widget Global para manejar la transición entre motores (YouTube vs Local) de forma transparente:
- Notificación al Usuario: Se añadió un mensaje informativo ("Reproduciendo audio alternativo - Sin video") cuando se activa la recuperación.
- Gestión de Velo: El desenfoque ahora se retira automáticamente cuando el audio alternativo comienza a sonar, permitiendo el control total de la interfaz.
- Sincronización de Store: Los comandos de reproducción manual (togglePlayPause) ahora inyectan estados directamente en `playerStore` para mantener la UI coherente.

### C. Limpieza de Estados de Error
Se añadió una limpieza profunda en `stopAllPlayback`:
- Se resetea el `lastErrorId` y la bandera `hasError` cada vez que se detiene la música o se cambia de pista.
- Previene que el sistema "recuerde" un error de una canción anterior y lo aplique erróneamente a la nueva.

---

## 3. Conclusiones y Mantenimiento
Para evitar regresiones, cualquier modificación en el motor de video debe:
1. Respetar el flujo de destrucción de Iframe ante estados de error.
2. Asegurar que las ráfagas de redimensionamiento (`forceIframeResize`) se ejecuten tras el `nextTick` de Vue para capturar el final de las transiciones CSS.
3. Mantener la política de "Solo Texto" (sin emojis) en los logs y alertas de sistema.
