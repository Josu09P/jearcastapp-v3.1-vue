import { db } from '@/data/firebase/firebase.config'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from 'firebase/firestore'

import type { PlaylistSongModel } from '@/domain/models/PlaylistSongModel'
import type { PlaylistModel } from '@/domain/models/PlayListModel'
// Crear o recuperar una playlist
export async function createOrGetPlaylistService(data: PlaylistModel): Promise<string> {
  const ref = collection(db, 'playlists')
  const q = query(ref, where('user_id', '==', data.user_id), where('name', '==', data.name))
  const snapshot = await getDocs(q)

  if (!snapshot.empty) return snapshot.docs[0].id

  const newDoc = await addDoc(ref, {
    ...data,
    created_at: serverTimestamp(),
  })
  return newDoc.id
}

// Obtener playlists del usuario
export async function fetchPlaylistsByUserIdService(user_id: string): Promise<PlaylistModel[]> {
  const ref = collection(db, 'playlists')
  const q = query(ref, where('user_id', '==', user_id))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...(doc.data() as PlaylistModel)
  }))
}

// Añadir canción a una playlist
export async function addSongToPlaylistService(playlistId: string, song: PlaylistSongModel): Promise<void> {
  const ref = collection(db, `playlists/${playlistId}/songs`)
  await addDoc(ref, {
    ...song,
    added_at: serverTimestamp()
  })
}

// Obtener canciones de una playlist
export async function fetchSongsByPlaylistIdService(playlistId: string): Promise<PlaylistSongModel[]> {
  const ref = collection(db, `playlists/${playlistId}/songs`)
  const snapshot = await getDocs(ref)

  return snapshot.docs.map(doc => doc.data() as PlaylistSongModel)
}
