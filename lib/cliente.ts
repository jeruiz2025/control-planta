export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.body
      ? { "Content-Type": "application/json", ...(init?.headers ?? {}) }
      : init?.headers,
  });
  const datos = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (datos as { error?: string } | null)?.error ?? "Error del servidor"
    );
  }
  return datos as T;
}
