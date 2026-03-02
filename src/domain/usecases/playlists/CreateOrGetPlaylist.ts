import { createOrGetPlaylistService } from '@/data/services/firestore/PlaylistsFirestore'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
export async function createOrGetPlaylist(data: PlaylistModel) {
  return await createOrGetPlaylistService(data)
}