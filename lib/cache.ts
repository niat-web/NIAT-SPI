interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlMs = 5 * 60 * 1000,
): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() < hit.expiresAt) return hit.data;
  const data = await fn();
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
  return data;
}
