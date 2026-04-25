import { deleteFavoriteArtist } from '@/data/services/firestore/FavoriteArtistsFirestore'

export const removeFavoriteArtistUseCase = async (
  userId: string,
  channelId: string,
): Promise<void> => {
  return await deleteFavoriteArtist(userId, channelId)
}
