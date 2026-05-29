export function resolveApiBaseUrl(): string {
  return import.meta.env.PUBLIC_API_URL
    || import.meta.env.PUBLIC_API_BASE_URL
    || (typeof window !== 'undefined' ? '/api' : 'http://localhost:3000');
}
