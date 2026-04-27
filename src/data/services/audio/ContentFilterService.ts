
/**
 * ContentFilterService - Versión Abierta
 * Este servicio anteriormente filtraba contenido por términos específicos.
 * Ahora ha sido pulido para permitir una experiencia abierta a todos los usuarios.
 */
class ContentFilterService {
  /**
   * Permite todos los títulos sin restricciones.
   */
  isForbidden(_title: string): boolean {
    return false;
  }

  /**
   * No aplica exclusiones a las consultas de búsqueda.
   */
  getExclusionQuery(): string {
    return '';
  }

  /**
   * Retorna la lista de videos sin alteraciones.
   */
  filterVideos<T extends { title?: string; video_title?: string }>(videos: T[]): T[] {
    return videos;
  }
}

export const contentFilterService = new ContentFilterService();
