/**
 * Cloud Resource Manager
 * Handles loading resources from cloud storage with caching and fallback
 */

import type { CloudResourceManifest, ResourceReference } from '@/shared/types';

export interface LoadResourceOptions {
  cache?: boolean;
  cacheTTL?: number;
  fallback?: 'placeholder' | 'cache' | 'none';
}

export class CloudResourceManager {
  private static instance: CloudResourceManager;
  private cache: Map<string, { data: Blob; timestamp: number }> = new Map();
  private circuitBreakerState: Map<string, CircuitBreakerState> = new Map();

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): CloudResourceManager {
    if (!CloudResourceManager.instance) {
      CloudResourceManager.instance = new CloudResourceManager();
    }
    return CloudResourceManager.instance;
  }

  /**
   * Load a resource from URL with caching and fallback
   */
  public async loadResource(
    url: string,
    options: LoadResourceOptions = {}
  ): Promise<Blob> {
    const {
      cache = true,
      cacheTTL = 86400 * 1000, // 24 hours in ms
      fallback = 'cache',
    } = options;

    // Check cache first
    if (cache) {
      const cached = this.getFromCache(url, cacheTTL);
      if (cached) {
        console.log(`Loaded from cache: ${url}`);
        return cached;
      }
    }

    // Check circuit breaker
    if (this.isCircuitOpen(url)) {
      console.warn(`Circuit breaker open for: ${url}`);
      return this.handleFallback(url, fallback);
    }

    try {
      // Fetch from cloud
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Store in cache
      if (cache) {
        this.addToCache(url, blob);
      }

      // Reset circuit breaker on success
      this.resetCircuitBreaker(url);

      return blob;
    } catch (error) {
      console.error(`Failed to load resource: ${url}`, error);
      
      // Increment circuit breaker
      this.incrementCircuitBreaker(url);

      // Try fallback
      return this.handleFallback(url, fallback);
    }
  }

  /**
   * Load resource manifest from cloud
   */
  public async loadResourceManifest(
    baseUrl: string
  ): Promise<CloudResourceManifest> {
    const url = `${baseUrl}/manifest.json`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.statusText}`);
      }

      const manifest = await response.json();
      return manifest as CloudResourceManifest;
    } catch (error) {
      console.error('Failed to load resource manifest:', error);
      throw error;
    }
  }

  /**
   * Prefetch resources for better performance
   */
  public async prefetchResources(urls: string[]): Promise<void> {
    console.log(`Prefetching ${urls.length} resources...`);
    
    // Load resources in parallel
    const promises = urls.map((url) =>
      this.loadResource(url, { cache: true }).catch((err) => {
        console.error(`Failed to prefetch: ${url}`, err);
      })
    );

    await Promise.all(promises);
    console.log('Prefetch complete');
  }

  /**
   * Invalidate cache for specific URL or all
   */
  public invalidateCache(url?: string): void {
    if (url) {
      this.cache.delete(url);
      console.log(`Invalidated cache for: ${url}`);
    } else {
      this.cache.clear();
      console.log('Cleared entire cache');
    }
  }

  /**
   * Get resource from cache
   */
  private getFromCache(url: string, ttl: number): Blob | null {
    const cached = this.cache.get(url);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > ttl) {
      this.cache.delete(url);
      return null;
    }

    return cached.data;
  }

  /**
   * Add resource to cache
   */
  private addToCache(url: string, data: Blob): void {
    this.cache.set(url, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle fallback when resource loading fails
   */
  private async handleFallback(
    url: string,
    fallback: 'placeholder' | 'cache' | 'none'
  ): Promise<Blob> {
    if (fallback === 'cache') {
      const cached = this.cache.get(url);
      if (cached) {
        console.log(`Using stale cache for: ${url}`);
        return cached.data;
      }
    }

    if (fallback === 'placeholder') {
      return this.getPlaceholder();
    }

    throw new Error(`Failed to load resource: ${url}`);
  }

  /**
   * Get a placeholder blob
   */
  private getPlaceholder(): Blob {
    // Return a 1x1 transparent pixel
    const data = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    return new Blob([data], { type: 'image/png' });
  }

  /**
   * Check if circuit breaker is open for URL
   */
  private isCircuitOpen(url: string): boolean {
    const state = this.circuitBreakerState.get(url);
    if (!state) return false;

    const { failures, lastFailure, resetTimeout } = state;
    const threshold = 5;

    // Reset if enough time has passed
    if (Date.now() - lastFailure > resetTimeout) {
      this.circuitBreakerState.delete(url);
      return false;
    }

    return failures >= threshold;
  }

  /**
   * Increment circuit breaker failure count
   */
  private incrementCircuitBreaker(url: string): void {
    const state = this.circuitBreakerState.get(url) || {
      failures: 0,
      lastFailure: 0,
      resetTimeout: 60000, // 1 minute
    };

    state.failures++;
    state.lastFailure = Date.now();
    this.circuitBreakerState.set(url, state);
  }

  /**
   * Reset circuit breaker on successful load
   */
  private resetCircuitBreaker(url: string): void {
    this.circuitBreakerState.delete(url);
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; urls: string[] } {
    return {
      size: this.cache.size,
      urls: Array.from(this.cache.keys()),
    };
  }
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  resetTimeout: number;
}

/**
 * Factory function to get the singleton instance
 */
export function getCloudResourceManager(): CloudResourceManager {
  return CloudResourceManager.getInstance();
}
