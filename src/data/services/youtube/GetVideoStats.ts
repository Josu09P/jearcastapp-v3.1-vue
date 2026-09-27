export const getVideoStats = async (videoIds: string, apiKey: string) => {
  if (!videoIds) return []
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    if (!res.ok || data.error || !data.items || !Array.isArray(data.items)) {
      return []
    }

    return data.items.map((item: any) => ({
      videoId: item.id,
      viewCount: item.statistics?.viewCount || 0,
      likeCount: item.statistics?.likeCount || 0,
    }))
  } catch (e) {
    console.warn('Error obteniendo stats de videos:', e)
    return []
  }
}
