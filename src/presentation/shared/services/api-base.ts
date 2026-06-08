export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side (SSR) requires an absolute URL.
    const url = import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_BASE_URL;
    if (url && url.startsWith('http')) {
      return url;
    }
    // Fallback to local NestJS backend port
    return 'http://localhost:3001';
  }

  // Client-side (Browser) uses relative /api to route through same-origin proxy
  return '/api';
}
