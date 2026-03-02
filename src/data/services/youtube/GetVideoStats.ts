export const getVideoStats = async (videoIds: string, apiKey: string) => {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.items.map((item: any) => ({
    videoId: item.id,
    viewCount: item.statistics.viewCount,
    likeCount: item.statistics.likeCount,
  }));
};
