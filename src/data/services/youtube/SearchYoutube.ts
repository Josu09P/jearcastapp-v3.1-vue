// USE APIKEY FOR SEARCH
export const searchYoutube = async (query: string, apiKey: string) => {
  const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=20`

  const res = await fetch(url)
  const data = await res.json()

  if (!res.ok || data.error) {
    const errorMsg = data.error?.message || `YouTube API error: ${res.status}`
    const isQuota =
      res.status === 403 ||
      errorMsg.toLowerCase().includes('quota') ||
      data.error?.errors?.some((e: any) => e.reason === 'quotaExceeded')
    throw new Error(isQuota ? `quotaExceeded (403): ${errorMsg}` : errorMsg)
  }

  if (!data.items || !Array.isArray(data.items)) {
    return []
  }

  return data.items
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet?.title || '',
      thumbnail: item.snippet?.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
    }))
}
