import type { Timestamp } from 'firebase/firestore'

export interface FavoriteArtistModel {
  id?: string
  user_id: string
  artist_name: string
  channel_id: string
  thumbnail: string
  genres: string[]
  subscriber_count?: string
  created_at?: Timestamp
}
