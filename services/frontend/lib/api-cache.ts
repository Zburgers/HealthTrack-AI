// API Request Cache to prevent duplicate calls
class RequestCache {
  private cache = new Map<string, Promise<unknown>>();
  private timeouts = new Map<string, NodeJS.Timeout>();
  
  async fetchWithCache<T>(url: string, options?: RequestInit, ttl: number = 5000): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Return existing promise if request is in flight
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as Promise<T>;
    }
    
    // Create new request
    const requestPromise = fetch(url, options)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .finally(() => {
        // Clear cache after request completes
        this.cache.delete(cacheKey);
        if (this.timeouts.has(cacheKey)) {
          clearTimeout(this.timeouts.get(cacheKey)!);
          this.timeouts.delete(cacheKey);
        }
      });
    
    // Store promise in cache
    this.cache.set(cacheKey, requestPromise);
    
    // Set timeout to clear cache entry
    const timeout = setTimeout(() => {
      this.cache.delete(cacheKey);
      this.timeouts.delete(cacheKey);
    }, ttl);
    
    this.timeouts.set(cacheKey, timeout);
    
    return requestPromise;
  }
  
  clearCache(): void {
    this.cache.clear();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }
}

export const apiCache = new RequestCache();