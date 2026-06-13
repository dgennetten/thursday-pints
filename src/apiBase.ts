/** API root. In dev, always use the Vite proxy (/api → thursdaypints.com) to avoid CORS. */
export function getApiBase(): string {
  if (import.meta.env.DEV) return '/api';
  return import.meta.env.VITE_API_BASE_URL || '/api';
}
