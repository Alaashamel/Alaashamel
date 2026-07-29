import { logger } from './logger.js';

export async function withRetry(fn, options = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    shouldRetry = (err) => true,
    onRetry = null,
  } = options;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isRateLimit = err.status === 403
        || err.status === 429
        || (err.message && err.message.includes('rate limit'));

      const isServerError = err.status >= 500;

      if (!shouldRetry(err) || (!isRateLimit && !isServerError && attempt === maxRetries)) {
        throw err;
      }

      const delay = isRateLimit
        ? Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000)
        : Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));

      if (onRetry) {
        onRetry(attempt, delay, err);
      }

      logger.warn(`Attempt ${attempt}/${maxRetries} failed, retrying in ${Math.round(delay)}ms`, {
        error: err.message,
        status: err.status,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
