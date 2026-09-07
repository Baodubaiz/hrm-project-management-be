import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('redis.host', 'localhost');
    const port = this.configService.get<number>('redis.port', 6379);
    const password = this.configService.get<string>('redis.password', '');
    const db = this.configService.get<number>('redis.db', 0);

    this.client = new Redis({
      host,
      port,
      password: password || undefined,
      db,
      lazyConnect: true,
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.logger.log(`Successfully connected to Redis at ${host}:${port}`);
    });

    this.client.on('error', (err: any) => {
      this.logger.warn(`Redis connection error: ${err.message}`);
    });

    // Try connecting asynchronously
    this.client.connect().catch((err: any) => {
      this.logger.warn(`Initial Redis connection failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  getClient(): Redis {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error: any) {
      this.logger.error(`Redis GET error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK' | null> {
    try {
      if (ttlSeconds) {
        return await this.client.set(key, value, 'EX', ttlSeconds);
      }
      return await this.client.set(key, value);
    } catch (error: any) {
      this.logger.error(`Redis SET error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error: any) {
      this.logger.error(`Redis DEL error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const count = await this.client.exists(key);
      return count > 0;
    } catch (error: any) {
      this.logger.error(`Redis EXISTS error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async setJson(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
    try {
      const jsonStr = JSON.stringify(value);
      const res = await this.set(key, jsonStr, ttlSeconds);
      return res === 'OK';
    } catch (error: any) {
      this.logger.error(`Redis setJson error for key ${key}: ${error.message}`);
      return false;
    }
  }

  async getJson<T>(key: string): Promise<T | null> {
    try {
      const jsonStr = await this.get(key);
      if (!jsonStr) return null;
      return JSON.parse(jsonStr) as T;
    } catch (error: any) {
      this.logger.error(`Redis getJson error for key ${key}: ${error.message}`);
      return null;
    }
  }

  async blacklistToken(token: string, ttlSeconds: number): Promise<void> {
    await this.set(`blacklist:${token}`, '1', ttlSeconds);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.exists(`blacklist:${token}`);
  }
}

