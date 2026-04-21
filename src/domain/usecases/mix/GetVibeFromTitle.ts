/**
 * Extrae palabras clave significativas del título de una canción
 * para realizar búsquedas de similitud.
 */
export const getKeywordsFromTitle = (title: string): string[] => {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Quitar símbolos
    .split(/\s+/)
    .filter(word => word.length > 3) // Solo palabras significativas
    .filter(word => !['video', 'official', 'lyrics', 'letra', 'audio', 'full', 'hd', 'music'].includes(word))
}

/**
 * Calcula un índice de similitud entre dos títulos de canciones.
 */
export const calculateSimilarity = (title1: string, title2: string): number => {
  const words1 = getKeywordsFromTitle(title1)
  const words2 = getKeywordsFromTitle(title2)
  
  const intersection = words1.filter(word => words2.includes(word))
  return intersection.length
}

/**
 * Intenta extraer el artista principal del autor o título.
 */
export const detectMainArtist = (author?: string, title?: string): string | null => {
  if (author && !author.toLowerCase().includes('topic')) {
    return author.trim()
  }
  
  if (title) {
    const parts = title.split(/[-–—]/)
    if (parts.length > 1) return parts[0].trim()
  }
  
  return null
}
