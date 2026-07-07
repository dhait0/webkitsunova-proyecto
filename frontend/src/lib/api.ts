const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

type ApiBody = Record<string, unknown> | FormData | undefined;

export async function apiFetch<T>(path: string, options: { method?: string; body?: ApiBody } = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  let body: BodyInit | null | undefined = undefined;

  if (options.body !== undefined) {
    body = isFormData
      ? (options.body as FormData)
      : JSON.stringify(options.body as Record<string, unknown>);
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
    body
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}
