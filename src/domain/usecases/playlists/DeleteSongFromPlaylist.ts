import { deleteSongFromPlaylistService } from "@/data/services/firestore/RecommendedPlaylistFirestore";

export async function deleteSongFromPlaylist(playlistId: string, videoId: string): Promise<void> {
  await deleteSongFromPlaylistService(playlistId, videoId)
}