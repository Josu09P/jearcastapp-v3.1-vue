import { getArtistSongs } from '@/domain/usecases/artists/GetArtistSongsUseCase'
import type { MixModel, MixSongModel, ArtistAnalysis } from '@/domain/models/MixModel'

export const createArtistMix = async (
  artistAnalysis: ArtistAnalysis,
): Promise<MixModel> => {
  try {
    let allSongs: MixSongModel[] = [...artistAnalysis.songs]

    // Si tenemos menos de 10 canciones del artista en favoritos, complementar con sus pistas de estudio individuales
    if (artistAnalysis.songs.length < 10) {
      const needed = 15 - artistAnalysis.songs.length
      const artistTracks = await getArtistSongs(artistAnalysis.name, Math.max(needed, 10))

      const existingIds = new Set(artistAnalysis.songs.map((s) => s.videoId))
      const newSongs: MixSongModel[] = artistTracks
        .filter((song) => !existingIds.has(song.videoId))
        .map((song) => ({
          videoId: song.videoId,
          title: song.title,
          thumbnail: song.thumbnail,
          artist: artistAnalysis.name
        }))

      allSongs = [...artistAnalysis.songs, ...newSongs]
    }

    const limitedSongs = allSongs.slice(0, 15)

    return {
      id: `mix_${artistAnalysis.name.replace(/\s+/g, '_')}_${Date.now()}`,
      name: `Mix de ${artistAnalysis.name}`,
      description: artistAnalysis.count > 0 
        ? `${artistAnalysis.count} en favoritos y canciones recomendadas`
        : `Lo mejor de ${artistAnalysis.name}`,
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
