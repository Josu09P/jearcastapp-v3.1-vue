import { addFavoriteArtist } from '@/data/services/firestore/FavoriteArtistsFirestore'
import type { FavoriteArtistModel } from '@/domain/models/FavoriteArtistModel'

export const addFavoriteArtistUseCase = async (
  data: FavoriteArtistModel,
): Promise<'added' | 'exists'> => {
  return await addFavoriteArtist(data)
}
