import { youtubeScraperService } from '@/data/services/youtube/YouTubeScraperService'
import type { MixModel, MixSongModel, ArtistAnalysis } from '@/domain/models/MixModel'

export const createArtistMix = async (
  artistAnalysis: ArtistAnalysis,
): Promise<MixModel> => {
  try {
    let allSongs = [...artistAnalysis.songs]

    // ✅ Uso de Scraping Ético: No requiere tokens ni API Key
    // Solo buscar más canciones si tenemos menos de 8
    if (artistAnalysis.songs.length < 8) {
      // ✅ Búsqueda optimizada: Evitamos la palabra "mix" para que no traiga listas de 1 hora
      // Usamos términos que sugieren canciones individuales oficiales.
      const query = `${artistAnalysis.name} official audio top songs`
      const searchResults = await youtubeScraperService.searchWithoutToken(query)
      
      const existingIds = new Set(artistAnalysis.songs.map((s) => s.videoId))
      
      const newSongs = searchResults
        .filter((song: any) => {
          const title = song.title.toLowerCase()
          const author = song.author.toLowerCase()
          const artistName = artistAnalysis.name.toLowerCase()

          // ❌ FILTRO DE RECOPILATORIOS: Evitar videos que sean compilaciones largas
          const isCompilation = title.includes('mix') || 
                                title.includes('completo') || 
                                title.includes('álbum') || 
                                title.includes('album') || 
                                title.includes('best of') ||
                                title.includes('grandes éxitos') ||
                                title.includes('sus mejores') ||
                                title.includes('compilation')

          // 🔍 VALIDACIÓN DE AUTOR: Intentar que el autor del video coincida o contenga el nombre del artista
          const isOfficialSource = author.includes(artistName) || artistName.includes(author)

          return !existingIds.has(song.videoId) && !isCompilation && (isOfficialSource || artistAnalysis.songs.length < 3)
        })
        .map((song: any) => ({
          videoId: song.videoId,
          title: song.title,
          thumbnail: song.thumbnail,
          artist: song.author
        }))
        
      allSongs = [...artistAnalysis.songs, ...newSongs]
    }

    const limitedSongs = allSongs.slice(0, 10)

    return {
      id: `mix_${artistAnalysis.name}_${Date.now()}`,
      name: `${artistAnalysis.name} Mix`,
      description: `${artistAnalysis.count} canciones en favoritos`,
      cover: artistAnalysis.songs[0]?.thumbnail || (limitedSongs[0]?.thumbnail as string) || '',
      artist: artistAnalysis.name,
      songs: limitedSongs,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error('Error creando mix del artista:', error)
    throw error
  }
}
