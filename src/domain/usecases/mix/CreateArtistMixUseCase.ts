import { searchSongsByArtist } from '@/data/services/youtube/SearchByArtistService'
import type { MixModel, MixSongModel, ArtistAnalysis } from '@/domain/models/MixModel'

export const createArtistMix = async (
  artistAnalysis: ArtistAnalysis,
  apiKey: string,
): Promise<MixModel> => {
  try {
    let allSongs = [...artistAnalysis.songs]

    // Solo buscar más canciones si tenemos menos de 8
    if (artistAnalysis.songs.length < 8) {
      const moreSongs = await searchSongsByArtist(artistAnalysis.name, apiKey, 8)
      const existingIds = new Set(artistAnalysis.songs.map((s) => s.videoId))
      const newSongs = moreSongs.filter((song: any) => !existingIds.has(song.videoId))
      allSongs = [...artistAnalysis.songs, ...newSongs]
    }

    const limitedSongs = allSongs.slice(0, 10) // Reducir de 20 a 15

    return {
      id: `mix_${artistAnalysis.name}_${Date.now()}`,
      name: `${artistAnalysis.name} Mix`,
      description: `${artistAnalysis.count} canciones en favoritos`,
      cover: artistAnalysis.songs[0]?.thumbnail || limitedSongs[0]?.thumbnail || '',
      artist: artistAnalysis.name,
      songs: limitedSongs,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error('Error creando mix del artista:', error)
    throw error
  }
}
