/**
 * Retry utility with exponential backoff and jitter.
 * Pure JS — no external dependencies.
 */

/**
 * Wraps an async function with retry logic using exponential backoff with jitter.
 * @param {Function} fn - async function to retry
 * @param {Object} options
 * @param {number} options.maxRetries - maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - base delay in ms before first retry (default: 1000)
 * @param {number} options.maxDelay - maximum delay cap in ms (default: 10000)
 * @param {string} options.friendlyMessage - user-facing error message on final failure
 * @param {Function} options.shouldRetry - optional predicate (error) => bool to decide if retry is warranted
 * @param {Function} options.onRetry - optional callback (attempt, error, delay) called before each retry wait
 * @returns {Promise} - result of fn, or throws a RetryError after all retries exhausted
 */
export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    friendlyMessage = 'Something went wrong. Please try again in a moment.',
    shouldRetry = () => true,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if this is the last attempt or shouldRetry says no
      if (attempt >= maxRetries || !shouldRetry(error)) {
        break;
      }

      // Exponential backoff: baseDelay * 2^attempt, capped at maxDelay
      const exponentialDelay = baseDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 500;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      if (onRetry) {
        onRetry(attempt + 1, error, delay);
      }

      await sleep(delay);
    }
  }

  // All retries exhausted — throw a user-friendly error
  const retryError = new RetryError(friendlyMessage, lastError);
  throw retryError;
}

/**
 * Custom error class that preserves the original error while exposing a friendly message.
 */
export class RetryError extends Error {
  constructor(friendlyMessage, originalError) {
    super(friendlyMessage);
    this.name = 'RetryError';
    this.originalError = originalError;
    this.isRetryError = true;
  }
}

/**
 * Determines if a Supabase error is retryable.
 * Network errors, timeouts, 5xx, and 429 (rate limit) are retryable.
 * 4xx auth/validation errors are NOT retryable.
 */
export function isRetryableSupabaseError(error) {
  if (!error) return false;

  // Network errors (fetch failures)
  if (error.message && (
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.message.includes('network') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('timeout')
  )) {
    return true;
  }

  // HTTP status-based decisions
  const status = error.status || error.statusCode || error.code;
  if (typeof status === 'number') {
    // Rate limiting — always retry
    if (status === 429) return true;
    // Server errors — retry
    if (status >= 500) return true;
    // Client errors (400, 401, 403, 404, 409, 422) — do NOT retry
    if (status >= 400 && status < 500) return false;
  }

  // Supabase string codes
  if (error.code === 'PGRST301' || error.code === 'PGRST502') return true;

  // Default: retry unknown errors (safer for network issues)
  return true;
}

/**
 * Pre-configured retry for Supabase read operations.
 */
export function withReadRetry(fn, friendlyMessage) {
  return withRetry(fn, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    friendlyMessage: friendlyMessage || 'Unable to load data. Please check your connection and try again.',
    shouldRetry: isRetryableSupabaseError,
  });
}

/**
 * Pre-configured retry for Supabase write operations.
 */
export function withWriteRetry(fn, friendlyMessage) {
  return withRetry(fn, {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    friendlyMessage: friendlyMessage || 'Unable to save your changes. Please try again.',
    shouldRetry: isRetryableSupabaseError,
  });
}

/**
 * Pre-configured retry for auth operations (fewer retries, faster).
 */
export function withAuthRetry(fn, friendlyMessage) {
  return withRetry(fn, {
    maxRetries: 2,
    baseDelay: 1000,
    maxDelay: 5000,
    friendlyMessage: friendlyMessage || 'Authentication failed. Please try signing in again.',
    shouldRetry: isRetryableSupabaseError,
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
