export const searchSongsByArtist = async (artist: string, apiKey: string, limit: number = 20) => {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(artist + ' canciones')}&part=snippet&type=video&maxResults=${limit}&videoCategoryId=10`

    const res = await fetch(url)
    const data = await res.json()

    if (!data.items) return []

    return data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
      artist: artist,
    }))
  } catch (error) {
    console.error('Error buscando canciones por artista:', error)
    return []
  }
}

export const getArtistFromTitle = (title: string): string => {
  // Patrones comunes en títulos de YouTube
  const patterns = [
    /^(.+?)\s*[-–—]\s*.+$/, // "Artista - Canción"
    /^(.+?)\s*:\s*.+$/, // "Artista: Canción"
    /^(.+?)\s*【.+?】.+$/, // "Artista 【...】..."
    /^(.+?)\s*\(.+?\).+$/, // "Artista (remix)..."
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match) return match[1].trim()
  }

  // Si no se detecta, tomar primeras palabras
  const words = title.split(' ')
  return words.slice(0, Math.min(2, words.length)).join(' ')
}
