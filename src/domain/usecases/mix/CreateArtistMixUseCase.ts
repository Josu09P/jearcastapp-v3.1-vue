import { searchSongsByArtist } from '@/data/services/youtube/SearchByArtistService'
import type { MixModel, MixSongModel, ArtistAnalysis } from '@/domain/models/MixModel'

export const createArtistMix = async (
  artistAnalysis: ArtistAnalysis,
  apiKey: string,
): Promise<MixModel> => {
  try {
    // 1. Buscar más canciones del artista en YouTube
    const moreSongs = await searchSongsByArtist(artistAnalysis.name, apiKey, 15)

    // 2. Combinar canciones existentes con nuevas (sin duplicados)
    const existingIds = new Set(artistAnalysis.songs.map((s) => s.videoId))
    const newSongs = moreSongs.filter((song: any) => !existingIds.has(song.videoId))

    // 3. Mezclar: poner las canciones conocidas primero, luego nuevas
    const allSongs = [...artistAnalysis.songs, ...newSongs]

    // 4. Limitar a 20 canciones máximo
    const limitedSongs = allSongs.slice(0, 20)

    // 5. Crear el mix
    return {
      id: `mix_${artistAnalysis.name}_${Date.now()}`,
      name: `${artistAnalysis.name} Mix`,
      description: `${artistAnalysis.count} canciones en favoritos + nuevas recomendaciones`,
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
