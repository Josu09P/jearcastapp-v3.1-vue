// src/domain/usecases/playlists/SongExistsInPlaylist.ts
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/data/firebase/firebase.config'

export async function songExistsInPlaylist(playlistId: string, videoId: string): Promise<boolean> {
  const songsRef = collection(db, `playlists/${playlistId}/songs`)
  const q = query(songsRef, where('video_id', '==', videoId))
  const snapshot = await getDocs(q)

  return !snapshot.empty
}
