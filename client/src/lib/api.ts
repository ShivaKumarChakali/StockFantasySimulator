import { Capacitor } from "@capacitor/core";

/**
 * Get the API base URL based on the environment
 * - In browser: uses relative URLs (works with same-origin server)
 * - In mobile app: uses the configured server URL from Capacitor config
 * - Can be overridden with VITE_API_URL environment variable
 */
export function getApiBaseUrl(): string {
  // Allow override via environment variable (for production builds)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In mobile app (Capacitor), detect server URL
  if (Capacitor.isNativePlatform()) {
    // When Capacitor has server.url configured, window.location reflects that URL
    if (typeof window !== 'undefined' && window.location) {
      const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      // If hostname is set and not localhost, use it
      // This works when Capacitor server.url is configured
      if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '') {
        return `${protocol}//${hostname}${port}`;
      }
    }
    
    // If no server URL detected, log a warning
    console.warn(
      '[API] No server URL configured for mobile app. ' +
      'Set server.url in capacitor.config.ts or VITE_API_URL environment variable.'
    );
  }

  // In browser: use relative URLs (same origin)
  return '';
}

/**
 * Create a full API URL from a path
 * @param path - API path (e.g., '/api/stocks' or 'api/stocks')
 */
export function apiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (baseUrl) {
    // Remove trailing slash from baseUrl if present
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBase}${cleanPath}`;
  }
  
  // Relative URL for same-origin requests
  return cleanPath;
}

