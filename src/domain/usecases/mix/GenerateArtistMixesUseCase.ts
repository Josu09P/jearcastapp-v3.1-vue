import { getFavoritesByUser } from '@/domain/usecases/favorites/GetFavoritesByUser'
import { analyzeFavoritesByArtist } from './AnalyzeFavoritesUseCase'
import { createArtistMix } from './CreateArtistMixUseCase'
import type { MixModel } from '@/domain/models/MixModel'

export const generateArtistMixes = async (
  userId: string,
  limit: number = 4,
): Promise<MixModel[]> => {
  try {
    // 1. Obtener favoritos del usuario (devuelve FavoritesResponse)
    const response = await getFavoritesByUser(userId)
    const favorites = Array.isArray(response) ? response : (response as any).favorites || []

    if (favorites.length === 0) {
      console.log('No hay favoritos para generar mixes')
      return []
    }

    // 2. Analizar favoritos por artista
    const artistAnalysis = analyzeFavoritesByArtist(favorites)

    if (artistAnalysis.length === 0) {
      return []
    }

    // 3. Tomar los top artistas
    const topArtists = artistAnalysis.slice(0, limit)

    // 4. Crear mix para cada artista
    const mixes: MixModel[] = []

    for (const artist of topArtists) {
      try {
        const mix = await createArtistMix(artist)
        mixes.push(mix)
      } catch (error) {
        console.error(`Error creando mix para ${artist.name}:`, error)
      }
    }

    return mixes
  } catch (error) {
    console.error('Error generando mixes:', error)
    return []
  }
}
