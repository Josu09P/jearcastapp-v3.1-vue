import type { FavoriteMusicModel } from '@/domain/models/FavoriteMusicModel'
import { getArtistFromTitle } from '@/data/services/youtube/SearchByArtistService'
import type { ArtistAnalysis, MixSongModel } from '@/domain/models/MixModel'

export const analyzeFavoritesByArtist = (favorites: FavoriteMusicModel[]): ArtistAnalysis[] => {
  const artistMap = new Map<string, { count: number; songs: MixSongModel[] }>()

  favorites.forEach((fav) => {
    const artist = getArtistFromTitle(fav.video_title)

    if (!artistMap.has(artist)) {
      artistMap.set(artist, {
        count: 0,
        songs: [],
      })
    }

    const artistData = artistMap.get(artist)!
    artistData.count++

    // Evitar duplicados de canciones
    if (!artistData.songs.some((s) => s.videoId === fav.video_id)) {
      artistData.songs.push({
        videoId: fav.video_id,
        title: fav.video_title,
        thumbnail: fav.video_thumbnail,
        artist: artist,
      })
    }
  })

  // Convertir a array y ordenar por cantidad
  const result: ArtistAnalysis[] = []
  artistMap.forEach((value, key) => {
    result.push({
      name: key,
      count: value.count,
      songs: value.songs,
    })
  })

  return result.sort((a, b) => b.count - a.count)
}
