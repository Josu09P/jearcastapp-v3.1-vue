import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  limit,
  startAfter,
  type QueryDocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '../../firebase/firebase.config'
import type { FavoriteArtistModel } from '@/domain/models/FavoriteArtistModel'

export interface ArtistsResponse {
  artists: FavoriteArtistModel[]
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
}

/**
 * Agregar artista a favoritos
 */
export async function addFavoriteArtist(data: FavoriteArtistModel): Promise<'added' | 'exists'> {
  const artistsRef = collection(db, 'favorite_artists')

  // Verificar si ya existe
  const q = query(
    artistsRef,
    where('user_id', '==', data.user_id),
    where('channel_id', '==', data.channel_id),
  )

  const snapshot = await getDocs(q)

  if (!snapshot.empty) {
    return 'exists'
  }

  await addDoc(artistsRef, {
    ...data,
    created_at: serverTimestamp(),
  })

  return 'added'
}

/**
 * Obtener artistas favoritos de un usuario (con paginación)
 */
export async function fetchFavoriteArtists(
  userId: string,
  pageSize: number = 50,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
): Promise<ArtistsResponse> {
  let q = query(
    collection(db, 'favorite_artists'),
    where('user_id', '==', userId),
    limit(pageSize),
  )

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc))
  }

  const snapshot = await getDocs(q)
  const artists = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FavoriteArtistModel[]

  return {
    artists,
    lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null,
  }
}

/**
 * Eliminar artista de favoritos
 */
export async function deleteFavoriteArtist(userId: string, channelId: string): Promise<void> {
  const q = query(
    collection(db, 'favorite_artists'),
    where('user_id', '==', userId),
    where('channel_id', '==', channelId),
  )
  const snap = await getDocs(q)
  for (const docRef of snap.docs) {
    await deleteDoc(doc(db, 'favorite_artists', docRef.id))
  }
}

/**
 * Verificar si un artista está en favoritos
 */
export async function isArtistFavorite(userId: string, channelId: string): Promise<boolean> {
  const q = query(
    collection(db, 'favorite_artists'),
    where('user_id', '==', userId),
    where('channel_id', '==', channelId),
  )
  const snap = await getDocs(q)
  return !snap.empty
}
