import { createClient, RedisClientType } from "redis";

/**
 * Redis Cache Manager
 *
 * Quản lý caching cho statistics data
 * - Cache full statistics data với TTL 1 giờ
 * - Check cache trước khi query database
 * - Invalidate cache khi cần thiết
 */
export class CacheManager {
  private static client: RedisClientType | null = null;
  private static isConnected = false;

  private static readonly CACHE_KEYS = {
    FULL_STATISTICS: "stats:full",
  };

  private static readonly TTL = {
    FULL_STATISTICS: 3600, // 1 hour
  };

  /**
   * Tạo TTL với jitter ngẫu nhiên (có thể âm hoặc dương)
   * Giúp tránh cache avalanche khi nhiều key expire cùng lúc
   * @param baseTtl Base TTL in seconds
   * @param maxVariance Maximum variance in seconds (default: 60)
   * @returns TTL with random variance in range [-maxVariance, +maxVariance]
   */
  private static generateTTLWithJitter(
    baseTtl: number,
    maxVariance: number = 60
  ): number {
    // Tạo jitter từ -maxVariance đến +maxVariance
    const jitter = Math.floor(Math.random() * (maxVariance * 2 + 1)) - maxVariance;
    return Math.max(1, baseTtl + jitter);
  }

  /**
   * Khởi tạo Redis connection
   * Gọi lần duy nhất khi app start
   */
  static async initialize(): Promise<void> {
    if (this.isConnected) return;

    try {
      const redisUrl = process.env.REDIS_URL;
      this.client = createClient({ url: redisUrl });

      this.client.on("error", (err) => {
        console.error("[Redis] Connection error:", err);
        this.isConnected = false;
      });

      this.client.on("connect", () => {
        console.log("[Redis] Connected successfully");
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error("[Redis] Failed to initialize:", error);
      this.isConnected = false;
    }
  }

  /**
   * Lấy data từ cache
   * @param key Cache key
   * @returns Data hoặc null nếu không tìm thấy/cache miss
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;

    try {
      const data = await this.client.get(key);
      if (!data) return null;

      return JSON.parse(data) as T;
    } catch (error) {
      console.error(`[Cache] Error getting key "${key}":`, error);
      return null;
    }
  }

  /**
   * Lưu data vào cache
   * @param key Cache key
   * @param value Data cần cache
   * @param ttl TTL in seconds (optional, default = 3600s)
   * @param withJitter Apply random jitter to TTL (optional, default = true)
   */
  static async set<T>(
    key: string,
    value: T,
    ttl?: number,
    withJitter: boolean = true
  ): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const serialized = JSON.stringify(value);
      const finalTtl = withJitter
        ? this.generateTTLWithJitter(ttl || 3600)
        : ttl;
      const options = finalTtl ? { EX: finalTtl } : undefined;
      await this.client.set(key, serialized, options);
      return true;
    } catch (error) {
      console.error(`[Cache] Error setting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Xóa data khỏi cache
   * @param key Cache key
   */
  static async delete(key: string): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      const result = await this.client.del(key);
      return result > 0;
    } catch (error) {
      console.error(`[Cache] Error deleting key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear tất cả cache (thường dùng khi debug hoặc invalidate)
   */
  static async clear(): Promise<boolean> {
    if (!this.client || !this.isConnected) return false;

    try {
      await this.client.flushDb();
      return true;
    } catch (error) {
      console.error("[Cache] Error clearing cache:", error);
      return false;
    }
  }

  /**
   * Lấy full statistics data từ cache
   * @returns Full statistics data hoặc null
   */
  static async getFullStatistics<T>(): Promise<T | null> {
    return this.get<T>(this.CACHE_KEYS.FULL_STATISTICS);
  }

  /**
   * Cache full statistics data
   * @param data Statistics data
   */
  static async setFullStatistics<T>(data: T): Promise<boolean> {
    return this.set<T>(
      this.CACHE_KEYS.FULL_STATISTICS,
      data,
      this.TTL.FULL_STATISTICS,
      true // Enable jitter
    );
  }

  /**
   * Invalidate full statistics cache
   * Gọi sau khi seed data hoặc update records
   */
  static async invalidateFullStatistics(): Promise<boolean> {
    return this.delete(this.CACHE_KEYS.FULL_STATISTICS);
  }

  /**
   * Disconnect Redis
   * Gọi lần duy nhất khi app shutdown
   */
  static async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  /**
   * Kiểm tra trạng thái connection
   */
  static isHealthy(): boolean {
    return this.isConnected && this.client !== null;
  }
}

export default CacheManager;
