export interface MixModel {
  id: string
  name: string
  description: string
  cover: string
  artist: string
  songs: MixSongModel[]
  createdAt: Date
}

export interface MixSongModel {
  videoId: string
  title: string
  thumbnail: string
  artist?: string
}

export interface ArtistAnalysis {
  name: string
  count: number
  songs: MixSongModel[]
}
