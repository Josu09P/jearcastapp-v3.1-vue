import { fetchPlaylistsByUserIdService } from '@/data/services/firestore/PlaylistsFirestore'
export async function getPlaylistsByUser(user_id: string) {
  return await fetchPlaylistsByUserIdService(user_id)
}