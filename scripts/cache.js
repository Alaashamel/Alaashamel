import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { logger } from './logger.js';

const memoryCache = new Map();
const CACHE_DIR = join(process.cwd(), '.stats-cache');

export class StatsCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 3600000;
    this.useDisk = options.useDisk !== false;
    this._hitCount = 0;
    this._missCount = 0;
  }

  getHitRate() {
    const total = this._hitCount + this._missCount;
    return total === 0 ? 0 : (this._hitCount / total) * 100;
  }

  _isExpired(entry) {
    return Date.now() - entry.timestamp > this.ttlMs;
  }

  async get(key) {
    const normalizedKey = String(key);

    const memEntry = memoryCache.get(normalizedKey);
    if (memEntry && !this._isExpired(memEntry)) {
      this._hitCount++;
      return memEntry.data;
    }

    if (memEntry) {
      memoryCache.delete(normalizedKey);
    }

    if (this.useDisk) {
      try {
        const diskPath = join(CACHE_DIR, `${this._safeKey(normalizedKey)}.json`);
        const raw = await readFile(diskPath, 'utf-8');
        const entry = JSON.parse(raw);
        if (!this._isExpired(entry)) {
          memoryCache.set(normalizedKey, entry);
          this._hitCount++;
          return entry.data;
        }
      } catch {
        // cache miss on disk
      }
    }

    this._missCount++;
    return null;
  }

  async set(key, data) {
    const normalizedKey = String(key);
    const entry = {
      data,
      timestamp: Date.now(),
    };

    memoryCache.set(normalizedKey, entry);

    if (this.useDisk) {
      try {
        const dir = CACHE_DIR;
        if (!existsSync(dir)) {
          await mkdir(dir, { recursive: true });
        }
        const diskPath = join(dir, `${this._safeKey(normalizedKey)}.json`);
        await writeFile(diskPath, JSON.stringify(entry), 'utf-8');
      } catch (err) {
        logger.debug('Disk cache write failed', { key: normalizedKey, error: err.message });
      }
    }
  }

  async clear() {
    memoryCache.clear();
    this._hitCount = 0;
    this._missCount = 0;
    if (this.useDisk) {
      try {
        const dir = CACHE_DIR;
        if (existsSync(dir)) {
          const { rm } = await import('node:fs/promises');
          await rm(dir, { recursive: true, force: true });
        }
      } catch (err) {
        logger.debug('Disk cache clear failed', { error: err.message });
      }
    }
  }

  _safeKey(key) {
    return key.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

export const globalCache = new StatsCache();
