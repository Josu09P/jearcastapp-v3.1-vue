import { selectMusicFolder } from '@/data/services/electron/LocalMusicService'
import type { MusicFolderInfo } from '@/domain/models/LocalMusicModel'

export const selectMusicFolderUseCase = async (): Promise<MusicFolderInfo | null> => {
  return await selectMusicFolder()
}
