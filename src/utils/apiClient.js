/**
 * Optimized API Client with:
 * - Request deduplication (prevents duplicate calls)
 * - Retry logic with exponential backoff
 * - Request timeout handling
 * - AbortController support (cancels in-flight requests)
 * - Concurrent request limiting
 * - Error handling for Render free-tier timeouts
 */

// Request cache to prevent duplicate calls
const pendingRequests = new Map();
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache for GET requests

// Request queue to limit concurrent requests
const MAX_CONCURRENT_REQUESTS = 5;
let activeRequests = 0;
const requestQueue = [];

// Process queued requests
const processQueue = () => {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS || requestQueue.length === 0) {
    return;
  }

  const { resolve, requestFn, abortController } = requestQueue.shift();
  activeRequests++;

  requestFn()
    .then((result) => {
      activeRequests--;
      resolve(result);
      processQueue(); // Process next in queue
    })
    .catch((error) => {
      activeRequests--;
      resolve(Promise.reject(error));
      processQueue(); // Process next in queue
    });
};

/**
 * Creates a request key for deduplication
 */
const getRequestKey = (url, options) => {
  const method = options?.method || 'GET';
  const body = options?.body ? JSON.stringify(options.body) : '';
  return `${method}:${url}:${body}`;
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with retry, timeout, and deduplication
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @param {object} config - Additional config (retries, timeout, skipCache)
 * @returns {Promise<Response>}
 */
export const fetchWithRetry = async (
  url,
  options = {},
  config = {}
) => {
  const {
    retries = 3,
    timeout = 30000, // 30 seconds default timeout
    skipCache = false,
    skipDeduplication = false,
  } = config;

  const method = options.method || 'GET';
  const requestKey = getRequestKey(url, options);

  // ✅ Request deduplication - prevent duplicate calls
  if (!skipDeduplication && method === 'GET' && !skipCache) {
    // Check if same request is already pending
    if (pendingRequests.has(requestKey)) {
      console.log(`[API] Deduplicating request: ${url}`);
      return pendingRequests.get(requestKey);
    }

    // Check cache for recent GET requests
    const cached = requestCache.get(requestKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[API] Cache hit: ${url}`);
      return Promise.resolve(cached.response.clone());
    }
  }

  // Create AbortController for timeout and cancellation
  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
  }, timeout);

  // Create fetch promise with retry logic
  const fetchWithRetryInternal = async (attempt = 1) => {
    try {
      const fetchOptions = {
        ...options,
        signal: abortController.signal,
        headers: {
          ...options.headers,
        },
      };

      const response = await fetch(url, fetchOptions);

      // Clear timeout on success
      clearTimeout(timeoutId);

      // Cache successful GET responses
      if (method === 'GET' && response.ok && !skipCache) {
        const clonedResponse = response.clone();
        requestCache.set(requestKey, {
          response: clonedResponse,
          timestamp: Date.now(),
        });
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      // Don't retry on abort (timeout or manual cancellation)
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms: ${url}`);
      }

      // Retry logic with exponential backoff
      if (attempt < retries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10s delay
        console.warn(
          `[API] Request failed (attempt ${attempt}/${retries}), retrying in ${delay}ms:`,
          url,
          error.message
        );
        await sleep(delay);
        return fetchWithRetryInternal(attempt + 1);
      }

      // All retries exhausted
      throw error;
    }
  };

  // Wrap in queue if needed
  const requestPromise = new Promise((resolve, reject) => {
    const executeRequest = async () => {
      try {
        const response = await fetchWithRetryInternal();
        resolve(response);
      } catch (error) {
        reject(error);
      } finally {
        // Clean up pending request
        if (!skipDeduplication && method === 'GET') {
          pendingRequests.delete(requestKey);
        }
      }
    };

    // Queue request if at max concurrent requests
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      requestQueue.push({
        resolve,
        requestFn: executeRequest,
        abortController,
      });
    } else {
      activeRequests++;
      executeRequest()
        .then(resolve)
        .catch(reject)
        .finally(() => {
          activeRequests--;
          processQueue();
        });
    }
  });

  // Store pending request for deduplication
  if (!skipDeduplication && method === 'GET') {
    pendingRequests.set(requestKey, requestPromise);
  }

  return requestPromise;
};

/**
 * Clear request cache (useful when data changes)
 */
export const clearRequestCache = () => {
  requestCache.clear();
  pendingRequests.clear();
};

/**
 * Cancel all pending requests
 */
export const cancelAllRequests = () => {
  requestQueue.forEach(({ abortController }) => {
    abortController.abort();
  });
  requestQueue.length = 0;
  pendingRequests.clear();
};

