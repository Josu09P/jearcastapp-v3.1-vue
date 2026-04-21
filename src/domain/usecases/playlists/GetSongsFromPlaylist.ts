import { fetchSongsByPlaylistIdService } from '@/data/services/firestore/PlaylistsFirestore'
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore'

export const getSongsFromPlaylist = (
    playlistId: string, 
    pageSize: number = 50, 
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
) => fetchSongsByPlaylistIdService(playlistId, pageSize, lastVisibleDoc)
