export interface LocalTrack {
  id: string
  path: string
  title: string
  artist?: string
  album?: string
  duration?: number
  cover?: string
  format: string
  size: number
  added_at: Date
}

export interface MusicFolderInfo {
  path: string
  tracks: LocalTrack[]
  lastScan: Date
  totalSize: number
  totalTracks: number
}
