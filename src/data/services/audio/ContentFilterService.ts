
/**
 * Servicio de filtrado equilibrado.
 * Bloquea géneros mundanos específicos (pop, rock, jazz, remix, urbano)
 * pero permite palabras naturales como "amor" o "popular".
 */
class ContentFilterService {
  // Géneros prohibidos (se deben encontrar como palabra completa)
  private readonly BLACKLIST_GENRES = [
    'regueton', 'reggaeton', 'perreo', 'dembow', 
    'pop', 'rock', 'jazz', 'remix', 'trap', 'funk', 'disco'
  ];

  /**
   * Verifica si un título contiene un género prohibido como palabra exacta.
   */
  isForbidden(title: string): boolean {
    if (!title) return false;
    const cleanTitle = title.toLowerCase();

    // Verificamos cada género prohibido usando límites de palabra (\b)
    return this.BLACKLIST_GENRES.some(term => {
      // El regex \b asegura que solo coincida si es la palabra completa
      // Bloquea "Musica Pop" pero NO bloquea "Musica Popular"
      const regex = new RegExp(`\\b${term}\\b`, 'i');
      return regex.test(cleanTitle);
    });
  }

  /**
   * Retorna términos de exclusión para YouTube.
   */
  getExclusionQuery(): string {
    // Excluimos los más pesados en la búsqueda directa para no entorpecer
    return ' -regueton -reggaeton -pop -rock -remix';
  }

  /**
   * Filtra una lista de videos eliminando los prohibidos.
   */
  filterVideos<T extends { title?: string; video_title?: string }>(videos: T[]): T[] {
    return videos.filter(v => {
      const title = v.title || v.video_title || '';
      return !this.isForbidden(title);
    });
  }
}

export const contentFilterService = new ContentFilterService();
