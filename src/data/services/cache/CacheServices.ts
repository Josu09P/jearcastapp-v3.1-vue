interface CacheItem<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>()
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutos por defecto
  private readonly MAX_SIZE = 200 // Límite máximo para evitar fugas de memoria

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Si ya existe, lo eliminamos para que al re-insertar quede al final (más reciente)
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.MAX_SIZE) {
      // Si llegamos al límite, eliminamos el más antiguo (el primero insertado)
      const oldestKey = this.cache.keys().next().value
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    })
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    if (!item) return null

    // Verificar si expiró
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

export const cacheService = new CacheService()
