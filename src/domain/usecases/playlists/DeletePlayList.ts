import { deletePlaylistService } from "@/data/services/firestore/RecommendedPlaylistFirestore";

export async function deletePlaylist(playlistId: string): Promise<void> {
  await deletePlaylistService(playlistId)
}