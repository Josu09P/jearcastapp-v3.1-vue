import { collection, query, where, orderBy, getDocs, deleteDoc, doc, limit, startAfter, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'
import { db } from '../../firebase/firebase.config'
import type { FavoriteMusicModel } from '@/domain/models/FavoriteMusicModel'

export interface FavoritesResponse {
  favorites: FavoriteMusicModel[]
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
}

export const fetchFavoritesByUserId = async (
  userId: string, 
  pageSize: number = 50, 
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<FavoritesResponse> => {
  
  let q = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(pageSize)
  )

  if (lastVisibleDoc) {
    q = query(q, startAfter(lastVisibleDoc))
  }

  const snapshot = await getDocs(q)
  const favorites = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FavoriteMusicModel[]

  return {
    favorites,
    lastVisible: snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null
  }
}

export const deleteFavorite = async (userId: string, videoId: string): Promise<void> => {
  const q = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId),
    where('video_id', '==', videoId)
  )
  const snap = await getDocs(q)
  for (const docRef of snap.docs) {
    await deleteDoc(doc(db, 'favorites', docRef.id))
  }
}
