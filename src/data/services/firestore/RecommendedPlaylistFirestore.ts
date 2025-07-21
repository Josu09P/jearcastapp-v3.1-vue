import { db } from '@/data/firebase/firebase.config'
import type { RecommendedPlaylistModel } from '@/domain/models/RecommendedPlaylistModel'
import type { RecommendedSongModel } from '@/domain/models/RecommendedSongModel'
import { collection, CollectionReference, deleteDoc, doc, getDocs, query, QueryDocumentSnapshot, where, type DocumentData } from 'firebase/firestore'

export async function fetchRecommendedPlaylistsService(): Promise<RecommendedPlaylistModel[]> {
  const ref = collection(db, 'recommended_playlists')
  const snapshot = await getDocs(ref)

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    name: doc.data().name || doc.id
  }))
}

export async function fetchSongsFromRecommendedPlaylistService(playlistId: string): Promise<RecommendedSongModel[]> {
  const ref = collection(db, `recommended_playlists/${playlistId}/songs`)
  const snapshot = await getDocs(ref)

  return snapshot.docs.map((doc) => {
    const data = doc.data()
    return {
      video_id: data.video_id,
      video_title: data.video_title,
      video_thumbnail: data.video_thumbnail
    }
  })
}

interface PlaylistSongDocument extends DocumentData {
  video_id: string
}

export async function deleteSongFromPlaylistService(playlistId: string, videoId: string): Promise<void> {
  const ref = collection(db, `playlists/${playlistId}/songs`) as CollectionReference<PlaylistSongDocument>
  const q = query(ref, where('video_id', '==', videoId))
  const snapshot = await getDocs(q)

  if (snapshot.empty) throw new Error('Canción no encontrada en la playlist')

  const docToDelete: QueryDocumentSnapshot<PlaylistSongDocument> = snapshot.docs[0]
  await deleteDoc(docToDelete.ref)
}

export async function deletePlaylistService(playlistId: string): Promise<void> {
  const ref = doc(db, 'playlists', playlistId)
  await deleteDoc(ref)
}