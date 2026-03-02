import { deleteFavorite } from '@/data/services/firestore/FavoritesFirestore'

export const removeFavoriteMusic = async (payload: {
  user_id: string
  video_id: string
}) => {
  return await deleteFavorite(payload.user_id, payload.video_id)
}
    