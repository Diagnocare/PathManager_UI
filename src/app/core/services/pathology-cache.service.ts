import { Injectable } from '@angular/core';
import { PathologyDetails } from '../models/pathology.models';

interface CacheEntry {
  data: PathologyDetails;
  cachedAt: number;
}

/**
 * Caches the DISPLAY-SAFE pathology details (identity + license summary) in
 * localStorage so repeat visits don't re-hit the API on every load.
 *
 * SECURITY: only the display-safe projection is cached — PathologyDetails carries
 * a license *summary* (number/expiry/status), never the raw LicenseKey. The full
 * license (with key) is fetched on demand and is never persisted client-side.
 */
@Injectable({ providedIn: 'root' })
export class PathologyCacheService {
  private static readonly PREFIX = 'pm.pathology.';
  private static readonly MAX_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

  /** Returns cached details if present and fresh; otherwise null. */
  get(id: number): PathologyDetails | null {
    try {
      const raw = localStorage.getItem(this.key(id));
      if (!raw) return null;

      const entry = JSON.parse(raw) as CacheEntry;
      if (Date.now() - entry.cachedAt > PathologyCacheService.MAX_AGE_MS) {
        this.clear(id);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  }

  set(id: number, data: PathologyDetails): void {
    try {
      const entry: CacheEntry = { data, cachedAt: Date.now() };
      localStorage.setItem(this.key(id), JSON.stringify(entry));
    } catch {
      // Storage full/unavailable — caching is best-effort, ignore.
    }
  }

  clear(id: number): void {
    try {
      localStorage.removeItem(this.key(id));
    } catch {
      /* ignore */
    }
  }

  private key(id: number): string {
    return `${PathologyCacheService.PREFIX}${id}`;
  }
}
