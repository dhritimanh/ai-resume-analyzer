// Retry logic for Kimi API rate limits
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 3000, // Increased from 2s to 3s
  onRetry?: (attempt: number, delay: number) => void
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await fn();
      
      // Log rate limit info on successful calls (for monitoring)
      if (attempt === 0 && typeof result === 'object' && result !== null) {
        logRateLimitInfo(result, 'Success');
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error or engine overload
      const isRateLimit = 
        error.response?.data?.error?.type === 'rate_limit_reached_error' ||
        error.response?.data?.error?.type === 'engine_overloaded_error' ||
        error.response?.status === 429 ||
        error.message?.includes('rate_limit') ||
        error.message?.includes('concurrency') ||
        error.message?.includes('overloaded');
      
      if (isRateLimit) {
        // Log detailed rate limit info
        const details = getRateLimitDetails(error);
        console.log(`Rate limit error: ${details}`);
      }
      
      if (!isRateLimit || attempt === maxRetries - 1) {
        // Not a rate limit error, or we've exhausted retries
        throw error;
      }
      
      // Calculate delay with more aggressive exponential backoff
      // 3s, 6s, 12s, 24s, 48s
      const delay = initialDelay * Math.pow(2, attempt);
      
      // Notify caller about retry
      if (onRetry) {
        onRetry(attempt + 1, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export function isRateLimitError(error: any): boolean {
  return (
    error.response?.data?.error?.type === 'rate_limit_reached_error' ||
    error.response?.data?.error?.type === 'engine_overloaded_error' ||
    error.response?.status === 429 ||
    error.message?.includes('rate_limit') ||
    error.message?.includes('concurrency') ||
    error.message?.includes('overloaded')
  );
}

export function getRateLimitMessage(attempt: number, delay: number): string {
  const seconds = Math.ceil(delay / 1000);
  return `High demand detected. Retrying in ${seconds} seconds... (Attempt ${attempt}/5)`;
}

/**
 * Extract rate limit information from Kimi API response
 */
export interface RateLimitInfo {
  limit?: number;
  remaining?: number;
  reset?: number;
  resetDate?: Date;
}

export function extractRateLimitInfo(error: any): RateLimitInfo | null {
  const headers = error.response?.headers;
  
  if (!headers) {
    return null;
  }
  
  // Kimi API rate limit headers (common patterns)
  const info: RateLimitInfo = {};
  
  // Check various header formats
  if (headers['x-ratelimit-limit']) {
    info.limit = parseInt(headers['x-ratelimit-limit']);
  }
  
  if (headers['x-ratelimit-remaining']) {
    info.remaining = parseInt(headers['x-ratelimit-remaining']);
  }
  
  if (headers['x-ratelimit-reset']) {
    info.reset = parseInt(headers['x-ratelimit-reset']);
    info.resetDate = new Date(info.reset * 1000);
  }
  
  // Alternative header names
  if (headers['ratelimit-limit']) {
    info.limit = parseInt(headers['ratelimit-limit']);
  }
  
  if (headers['ratelimit-remaining']) {
    info.remaining = parseInt(headers['ratelimit-remaining']);
  }
  
  if (headers['ratelimit-reset']) {
    info.reset = parseInt(headers['ratelimit-reset']);
    info.resetDate = new Date(info.reset * 1000);
  }
  
  return Object.keys(info).length > 0 ? info : null;
}

/**
 * Get detailed rate limit error message
 */
export function getRateLimitDetails(error: any): string {
  const info = extractRateLimitInfo(error);
  
  if (!info) {
    return 'Rate limit reached. Please wait a moment and try again.';
  }
  
  let message = 'Rate limit reached.';
  
  if (info.remaining !== undefined) {
    message += ` Remaining: ${info.remaining}/${info.limit || '?'}`;
  }
  
  if (info.resetDate) {
    const now = new Date();
    const secondsUntilReset = Math.ceil((info.resetDate.getTime() - now.getTime()) / 1000);
    
    if (secondsUntilReset > 0) {
      message += ` Resets in ${secondsUntilReset}s`;
    }
  }
  
  return message;
}

/**
 * Check if we're approaching rate limit
 */
export function isApproachingRateLimit(response: any): boolean {
  const headers = response?.headers;
  
  if (!headers) {
    return false;
  }
  
  const remaining = parseInt(
    headers['x-ratelimit-remaining'] || 
    headers['ratelimit-remaining'] || 
    '999'
  );
  
  const limit = parseInt(
    headers['x-ratelimit-limit'] || 
    headers['ratelimit-limit'] || 
    '1000'
  );
  
  // Consider "approaching" if less than 10% remaining
  return remaining < (limit * 0.1);
}

/**
 * Log rate limit info for monitoring
 */
export function logRateLimitInfo(response: any, context: string = 'API Call') {
  const headers = response?.headers;
  
  if (!headers) {
    return;
  }
  
  const limit = headers['x-ratelimit-limit'] || headers['ratelimit-limit'];
  const remaining = headers['x-ratelimit-remaining'] || headers['ratelimit-remaining'];
  const reset = headers['x-ratelimit-reset'] || headers['ratelimit-reset'];
  
  if (limit || remaining) {
    console.log(`[${context}] Rate Limit: ${remaining || '?'}/${limit || '?'} remaining`);
    
    if (reset) {
      const resetDate = new Date(parseInt(reset) * 1000);
      console.log(`[${context}] Resets at: ${resetDate.toLocaleTimeString()}`);
    }
  }
}
