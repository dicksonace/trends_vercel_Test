// Request queue and rate limiting utilities
class RequestQueue {
  private queue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private minDelay = 2000; // 2 seconds between requests (much more conservative)

  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        fn: requestFn,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      
      // Wait if we need to respect rate limit
      if (timeSinceLastRequest < this.minDelay) {
        const waitTime = this.minDelay - timeSinceLastRequest;
        console.log(`🔍 DEBUG: Rate limiting - waiting ${waitTime}ms before next request`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const item = this.queue.shift();
      if (item) {
        try {
          const result = await item.fn();
          item.resolve(result);
          this.lastRequestTime = Date.now();
        } catch (error) {
          item.reject(error);
        }
      }
    }

    this.isProcessing = false;
  }
}

// Global request queue instance
const requestQueue = new RequestQueue();

// Cache for API responses to avoid duplicate requests
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60000; // 60 seconds cache (longer cache)

export async function queuedRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  // Check cache first
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`🔍 DEBUG: Using cached response for ${key}`);
    return cached.data;
  }

  // Queue the request
  console.log(`🔍 DEBUG: Queuing request for ${key}`);
  const result = await requestQueue.add(requestFn);
  
  // Cache the result
  responseCache.set(key, { data: result, timestamp: Date.now() });
  
  return result;
}

// Clear cache function for testing
export function clearCache() {
  responseCache.clear();
  console.log('🔍 DEBUG: Response cache cleared');
}

// Batch multiple status requests into one
export async function batchStatusRequests(postIds: string[]) {
  console.log(`🔍 DEBUG: Batching ${postIds.length} status requests`);
  
  // Process posts in small batches to avoid overwhelming the queue
  const batchSize = 3;
  const results = [];
  
  for (let i = 0; i < postIds.length; i += batchSize) {
    const batch = postIds.slice(i, i + batchSize);
    console.log(`🔍 DEBUG: Processing batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);
    
    const batchResults = await Promise.all(
      batch.map(postId => 
        Promise.all([
          queuedRequest(`like-status-${postId}`, () => 
            fetch(`/api/posts/${postId}/like-status`).then(res => res.json())
          ),
          queuedRequest(`bookmark-status-${postId}`, () => 
            fetch(`/api/posts/${postId}/bookmark-status`).then(res => res.json())
          )
        ])
      )
    );
    
    results.push(...batchResults);
    
    // Add extra delay between batches
    if (i + batchSize < postIds.length) {
      console.log('🔍 DEBUG: Waiting between batches...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  return results;
}
