
import { fetchRecommendedPlaylistsService } from '@/data/services/firestore/RecommendedPlaylistFirestore'
import type { RecommendedPlaylistModel } from '@/domain/models/RecommendedPlaylistModel'

export async function getRecommendedPlaylists(): Promise<RecommendedPlaylistModel[]> {
  return await fetchRecommendedPlaylistsService()
}
