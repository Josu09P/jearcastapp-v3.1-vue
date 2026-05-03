declare namespace YT {
    enum PlayerState { UNSTARTED = -1, ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3, CUED = 5 }
    class Player {
        constructor(elementId: string | HTMLElement, options: any)
        playVideo(): void; pauseVideo(): void; stopVideo(): void; mute(): void; unMute(): void
        setVolume(volume: number): void; setSize(width: number, height: number): void
        destroy(): void; getCurrentTime(): number; getDuration(): number
        getPlayerState(): PlayerState; seekTo(seconds: number, allowSeekAhead: boolean): void
        loadVideoById(options: { videoId: string, startSeconds?: number, suggestedQuality?: string }): void
        getVideoData(): { author: string; title: string; video_id: string }
    }
}

interface Window {
    YT: typeof YT
    onYouTubeIframeAPIReady: () => void
}
