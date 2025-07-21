import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/firebase.config'
import type { FavoriteMusicModel } from '@/domain/models/FavoriteMusicModel'

export const fetchFavoritesByUserId = async (userId: string): Promise<FavoriteMusicModel[]> => {
  const q = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  )

  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FavoriteMusicModel[]
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
