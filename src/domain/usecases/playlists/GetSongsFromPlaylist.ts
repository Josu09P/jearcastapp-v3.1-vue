import { fetchSongsByPlaylistIdService } from '@/data/services/firestore/PlaylistsFirestore'
export async function getSongsFromPlaylist(playlistId: string) {
  return await fetchSongsByPlaylistIdService(playlistId)
}