import { fetchFavoritesByUserId } from '@/data/services/firestore/FavoritesFirestore'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'

export const getFavoritesByUser = (
    userId: string, 
    pageSize: number = 50, 
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
) => fetchFavoritesByUserId(userId, pageSize, lastVisibleDoc)
