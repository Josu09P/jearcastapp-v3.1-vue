import { fetchSongsFromRecommendedPlaylistService } from '@/data/services/firestore/RecommendedPlaylistFirestore'
import type { RecommendedSongModel } from '@/domain/models/RecommendedSongModel'

export async function getSongsFromRecommendedPlaylist(playlistId: string): Promise<RecommendedSongModel[]> {
  return await fetchSongsFromRecommendedPlaylistService(playlistId)
}
