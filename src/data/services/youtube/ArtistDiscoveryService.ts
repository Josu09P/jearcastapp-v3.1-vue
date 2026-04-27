import type { ScrapedVideo } from './YouTubeScraperService'
import artistsDb from '@/data/host-db/artists-db.json'

export interface YouTubeChannel {
  channelId: string
  name: string
  description: string
  thumbnail: string
  subscriberCount: string
  videoCount: string
  url: string
  verified: boolean
  topics: string[]
}

export interface ArtistRecommendation {
  artist: YouTubeChannel
  similarArtists: YouTubeChannel[]
  topVideos: ScrapedVideo[]
  mixes: MixSuggestion[]
}

export interface MixSuggestion {
  name: string
  description: string
  songs: ScrapedVideo[]
  cover: string
}

class ArtistDiscoveryService {
  // Ahora se carga desde el JSON
  private POPULAR_ARTISTS: { name: string; channelId: string }[] = artistsDb

  // Caché local para datos enriquecidos (thumbnail, subscribers)
  private enrichedCache: Map<string, { thumbnail: string; subscriberCount: string }> = new Map()

  /**
   * Obtener datos enriquecidos de un canal desde el backend
   */
  async enrichChannelData(
    channelId: string,
  ): Promise<{ thumbnail: string; subscriberCount: string } | null> {
    // Revisar caché primero
    if (this.enrichedCache.has(channelId)) {
      return this.enrichedCache.get(channelId)!
    }

    try {
      if ((window as any).electron?.ipcRenderer?.invoke) {
        const info = await (window as any).electron.ipcRenderer.invoke(
          'youtube-channel-info',
          channelId,
        )
        if (info) {
          const data = {
            thumbnail: info.thumbnail || '',
            subscriberCount: info.subscriberCount || '',
          }
          this.enrichedCache.set(channelId, data)
          return data
        }
      }
      return null
    } catch {
      return null
    }
  }

  /**
   * Obtener thumbnail de un canal (con caché)
   */
  async getChannelThumbnail(channelId: string): Promise<string> {
    const enriched = await this.enrichChannelData(channelId)
    return enriched?.thumbnail || ''
  }

  /**
   * Obtener suscriptores de un canal (con caché)
   */
  async getChannelSubscriberCount(channelId: string): Promise<string> {
    const enriched = await this.enrichChannelData(channelId)
    return enriched?.subscriberCount || ''
  }

  async getChannelInfo(channelId: string): Promise<YouTubeChannel | null> {
    try {
      if ((window as any).electron?.ipcRenderer?.invoke) {
        return await (window as any).electron.ipcRenderer.invoke('youtube-channel-info', channelId)
      }
      return null
    } catch (error) {
      console.error('Error obteniendo info del canal:', error)
      return null
    }
  }

  async searchChannels(artistName: string): Promise<YouTubeChannel[]> {
    try {
      if ((window as any).electron?.ipcRenderer?.invoke) {
        return await (window as any).electron.ipcRenderer.invoke(
          'youtube-search-channels',
          artistName,
        )
      }
      return []
    } catch (error) {
      console.error('Error buscando canales:', error)
      return []
    }
  }

  getPopularArtists(): { name: string; channelId: string }[] {
    return this.POPULAR_ARTISTS
  }

  async getArtistTopVideos(channelId: string, limit: number = 10): Promise<ScrapedVideo[]> {
    try {
      if ((window as any).electron?.youtubeSearch) {
        const artist = this.POPULAR_ARTISTS.find((a) => a.channelId === channelId)
        if (artist) {
          return await (window as any).electron.youtubeSearch(`${artist.name} canciones populares`)
        }
      }
      return []
    } catch (error) {
      console.error('Error obteniendo videos del artista:', error)
      return []
    }
  }

  async generateArtistMix(channelId: string): Promise<MixSuggestion | null> {
    try {
      const artist = this.POPULAR_ARTISTS.find((a) => a.channelId === channelId)
      if (!artist) return null

      const videos = await this.getArtistTopVideos(channelId, 15)
      if (videos.length === 0) return null

      return {
        name: `${artist.name} Mix`,
        description: `Lo mejor de ${artist.name}`,
        songs: videos,
        cover: videos[0]?.thumbnail || '',
      }
    } catch (error) {
      console.error('Error generando mix:', error)
      return null
    }
  }

  getSimilarArtists(artistName: string): { name: string; channelId: string }[] {
    const genres: Record<string, string[]> = {
      pop: ['Taylor Swift', 'Ed Sheeran', 'Dua Lipa', 'Coldplay', 'The Weeknd'],
      reggaeton: ['Bad Bunny', 'Karol G', 'J Balvin', 'Shakira', 'Rihanna'],
      rock: ['Queen', 'Michael Jackson', 'Imagine Dragons', 'Coldplay'],
      edm: ['Avicii', 'Daft Punk', 'Calvin Harris', 'David Guetta']
    }

    let artistGenre = ''
    for (const [genre, artists] of Object.entries(genres)) {
      if (artists.some((a) => a.toLowerCase() === artistName.toLowerCase())) {
        artistGenre = genre
        break
      }
    }

    if (!artistGenre) return []

    return genres[artistGenre]
      .filter((a) => a.toLowerCase() !== artistName.toLowerCase())
      .map((name) => {
        const found = this.POPULAR_ARTISTS.find((a) => a.name === name)
        return found || { name, channelId: '' }
      })
      .filter((a) => a.channelId !== '')
  }
}

export const artistDiscoveryService = new ArtistDiscoveryService()
