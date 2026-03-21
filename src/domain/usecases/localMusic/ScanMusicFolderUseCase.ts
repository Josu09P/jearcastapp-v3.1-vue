import { scanMusicFolder } from '@/data/services/electron/LocalMusicService'
import type { LocalTrack } from '@/domain/models/LocalMusicModel'

export const scanMusicFolderUseCase = async (folderPath: string): Promise<LocalTrack[]> => {
  return await scanMusicFolder(folderPath)
}
