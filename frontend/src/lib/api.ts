import { supabase } from './supabase';

export async function apiFetch<T>(path: string, options: { method?: string; body?: Record<string, unknown> | FormData } = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No hay sesión activa');
  }

  const isFormData = options.body instanceof FormData;
  let body: BodyInit | null | undefined = undefined;

  if (options.body !== undefined) {
    body = isFormData
      ? (options.body as FormData)
      : JSON.stringify(options.body as Record<string, unknown>);
  }

  const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:3002'}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(isFormData ? undefined : { 'Content-Type': 'application/json' }),
    },
    body,
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}
