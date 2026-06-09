export function resolveApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side (SSR) requires an absolute URL. The runtime
    // environment decides which one:
    //
    //   - Vercel deploy: Vercel's serverless function cannot reach
    //     `localhost:3001` (the backend is not on Vercel's network).
    //     The build must set `SSR_API_URL=https://<backend-host>` so
    //     the SSR fetch hits the production backend over HTTPS.
    //   - Docker deploy: nginx in the same container reaches the
    //     backend at `http://backend:3001` (docker-compose service
    //     name) or `http://localhost:3001` (all-in-one image). The
    //     dev / Docker path does not need to set `SSR_API_URL`.
    //   - `npm run dev`: Astro standalone runs locally and reaches
    //     the backend on `localhost:3001`.
    //
    // `SSR_API_URL` is checked first, then `PUBLIC_API_URL` /
    // `PUBLIC_API_BASE_URL` (if absolute), then the local fallback.
    const ssrUrl = import.meta.env.SSR_API_URL;
    if (ssrUrl && ssrUrl.startsWith('http')) {
      return ssrUrl;
    }
    const publicUrl = import.meta.env.PUBLIC_API_URL || import.meta.env.PUBLIC_API_BASE_URL;
    if (publicUrl && publicUrl.startsWith('http')) {
      return publicUrl;
    }
    return 'http://localhost:3001';
  }

  // Client-side (Browser) uses relative /api to route through same-origin proxy
  return '/api';
}
