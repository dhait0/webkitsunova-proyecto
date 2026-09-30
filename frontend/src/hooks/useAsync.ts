import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  reload: () => Promise<void>;
  setData: (value: T | null) => void;
};

/**
 * Minimal data-fetching helper for the psychologist pages. The project has no
 * global state library, so each page owns its request lifecycle here.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      setData(await loader());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Error inesperado');
      setErrorCode(caught instanceof ApiError ? (caught.code ?? null) : null);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, loading, error, errorCode, reload, setData };
}
