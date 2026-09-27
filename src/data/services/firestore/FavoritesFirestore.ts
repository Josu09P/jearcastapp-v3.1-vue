import { collection, query, where, orderBy, getDocs, deleteDoc, doc, limit, startAfter, getCountFromServer, type QueryDocumentSnapshot, type DocumentData } from 'firebase/firestore'
import { db } from '../../firebase/firebase.config'
import type { FavoriteMusicModel } from '@/domain/models/FavoriteMusicModel'

export interface FavoritesResponse {
  favorites: FavoriteMusicModel[]
  lastVisible: QueryDocumentSnapshot<DocumentData> | null
}

/**
 * Obtiene el conteo total de favoritos de un usuario sin descargar los documentos.
 * Muy eficiente para mostrar en la UI.
 */
export const getFavoritesCount = async (userId: string): Promise<number> => {
  const q = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId)
  )
  const snapshot = await getCountFromServer(q)
  return snapshot.data().count
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

/**
 * Realiza una consulta a nivel de base de datos en Firestore para buscar
 * canciones en los favoritos de un usuario, buscando en toda su colección.
 */
export const searchFavoritesInFirestore = async (
  userId: string,
  searchQuery: string
): Promise<FavoriteMusicModel[]> => {
  if (!userId || !searchQuery.trim()) return []

  const cleanQuery = searchQuery.trim().toLowerCase()

  // Consulta directa a Firestore de los favoritos del usuario
  const q = query(
    collection(db, 'favorites'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  )

  const snapshot = await getDocs(q)
  const allFavorites = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as FavoriteMusicModel[]

  // Filtro de coincidencia de texto insensible a mayúsculas
  return allFavorites.filter((fav) => {
    const title = (fav.video_title || '').toLowerCase()
    return title.includes(cleanQuery)
  })
}
