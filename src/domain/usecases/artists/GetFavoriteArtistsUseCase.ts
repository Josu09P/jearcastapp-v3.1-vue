import { fetchFavoriteArtists } from '@/data/services/firestore/FavoriteArtistsFirestore'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'

export const getFavoriteArtistsUseCase = (
  userId: string,
  pageSize: number = 50,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
) => fetchFavoriteArtists(userId, pageSize, lastVisibleDoc)
