/**
 * Simple in-memory rate limiter for protecting against brute force attacks.
 * Uses a sliding window approach with IP-based tracking.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
}

/**
 * Check if an IP-based request should be rate limited.
 * Returns true if the request should be blocked, false if allowed.
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): { blocked: boolean; remaining: number; retryAfterMs: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  // No existing entry - create one and allow
  if (!entry || entry.resetAt <= now) {
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      blocked: false,
      remaining: config.maxAttempts - 1,
      retryAfterMs: 0,
    };
  }

  // Entry exists and within window
  if (entry.count >= config.maxAttempts) {
    return {
      blocked: true,
      remaining: 0,
      retryAfterMs: entry.resetAt - now,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(identifier, entry);

  return {
    blocked: false,
    remaining: config.maxAttempts - entry.count,
    retryAfterMs: 0,
  };
}

/**
 * Clear rate limit for an identifier (e.g., after successful auth)
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Get current rate limit status for an identifier
 */
export function getRateLimitStatus(identifier: string): { count: number; remaining: number; resetAt: number } | null {
  const entry = rateLimitStore.get(identifier);
  if (!entry) return null;
  return {
    count: entry.count,
    remaining: Math.max(0, 5 - entry.count),
    resetAt: entry.resetAt,
  };
}
