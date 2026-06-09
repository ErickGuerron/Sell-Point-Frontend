export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side (SSR) must use a real backend origin reachable from the
    // container/network namespace. `process.env` is the runtime source of
    // truth in Astro SSR for non-public variables.
    const runtimeUrl = process.env.BACKEND_URL
      || process.env.PUBLIC_API_URL
      || process.env.PUBLIC_API_BASE_URL;

    if (runtimeUrl && runtimeUrl.startsWith('http')) {
      return runtimeUrl;
    }

    // Local fallback for non-Docker dev only.
    return 'http://localhost:3001';
  }

  // Client-side (Browser) uses relative /api to route through same-origin proxy
  return '/api';
}
