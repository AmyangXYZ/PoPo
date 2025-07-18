import { Redis } from "@upstash/redis"

interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
}

interface PoseResult {
  description: string
  face: Record<string, number>
  movableBones: Record<string, [number, number, number]>
  rotatableBones: Record<string, [number, number, number, number]>
}

interface CachedPoseData {
  result: PoseResult
  aiModel: string
  temperature: number
  topP: number
  timestamp: number
}

class PoseCache {
  private redis: Redis | null = null
  private config: CacheConfig

  constructor() {
    // Initialize Redis client if environment variables are provided
    if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
      this.redis = new Redis({
        url: process.env.REDIS_URL,
        token: process.env.REDIS_TOKEN,
      })
    } else if (process.env.REDIS_URL) {
      // For standard Redis URLs (like Railway Redis)
      this.redis = Redis.fromEnv()
    }

    this.config = {
      enabled: !!this.redis && process.env.REDIS_ENABLED !== "false",
      ttl: parseInt(process.env.REDIS_TTL || "604800"), // Default 7 days (86400 * 7)
    }
  }

  private generateCacheKey(description: string, aiModel: string, temperature: number, topP: number): string {
    // Create a deterministic cache key based on all parameters that affect the result
    const params = `${aiModel}-${temperature}-${topP}`
    // Use a simple hash of the description to keep keys clean
    const descriptionHash = this.simpleHash(description.toLowerCase().trim())
    return `pose:${params}:${descriptionHash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async get(description: string, aiModel: string, temperature: number, topP: number): Promise<PoseResult | null> {
    if (!this.config.enabled || !this.redis) {
      return null
    }

    try {
      const key = this.generateCacheKey(description, aiModel, temperature, topP)
      const cached = await this.redis.get<CachedPoseData>(key)

      if (cached) {
        console.log(`Cache HIT for description: "${description}"`)
        return cached.result
      } else {
        console.log(`Cache MISS for description: "${description}"`)
        return null
      }
    } catch (error) {
      console.error("Cache get error:", error)
      return null
    }
  }

  async set(
    description: string,
    result: PoseResult,
    aiModel: string,
    temperature: number,
    topP: number
  ): Promise<void> {
    if (!this.config.enabled || !this.redis) {
      return
    }

    try {
      const key = this.generateCacheKey(description, aiModel, temperature, topP)
      const cachedData: CachedPoseData = {
        result,
        aiModel,
        temperature,
        topP,
        timestamp: Date.now(),
      }

      await this.redis.setex(key, this.config.ttl, JSON.stringify(cachedData))
      console.log(`Cached pose for description: "${description}"`)
    } catch (error) {
      console.error("Cache set error:", error)
    }
  }

  async getStats(): Promise<{ enabled: boolean; keyCount?: number }> {
    if (!this.config.enabled || !this.redis) {
      return { enabled: false }
    }

    try {
      // Get approximate count of pose cache keys
      const keys = await this.redis.keys("pose:*")
      return { enabled: true, keyCount: keys.length }
    } catch (error) {
      console.error("Cache stats error:", error)
      return { enabled: true }
    }
  }

  async clear(): Promise<void> {
    if (!this.config.enabled || !this.redis) {
      return
    }

    try {
      const keys = await this.redis.keys("pose:*")
      if (keys.length > 0) {
        await this.redis.del(...keys)
        console.log(`Cleared ${keys.length} cached poses`)
      }
    } catch (error) {
      console.error("Cache clear error:", error)
    }
  }
}

// Export singleton instance
export const poseCache = new PoseCache()
export type { PoseResult, CachedPoseData }
