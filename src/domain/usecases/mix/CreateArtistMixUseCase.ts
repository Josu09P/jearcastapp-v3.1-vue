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
      const moreSongs = await youtubeScraperService.searchWithoutToken(`${artistAnalysis.name} mix`)
      
      const existingIds = new Set(artistAnalysis.songs.map((s) => s.videoId))
      const newSongs = moreSongs
        .filter((song: any) => !existingIds.has(song.videoId))
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
