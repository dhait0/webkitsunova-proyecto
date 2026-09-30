import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import type { AdminPaginationMeta } from '@/components/admin/types';

export type AdminListQuery = {
  search: string;
  status: string;
  page: number;
  limit: number;
};

type UseAdminListOptions<T, P extends { pagination: AdminPaginationMeta }> = {
  fetcher: (query: AdminListQuery) => Promise<P>;
  selectRows: (payload: P) => T[];
  idOf: (row: T) => string;
  limit?: number;
  errorMessage: string;
};

export function useAdminList<T, P extends { pagination: AdminPaginationMeta }>({
  fetcher,
  selectRows,
  idOf,
  limit = 10,
  errorMessage,
}: UseAdminListOptions<T, P>) {
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const selectRowsRef = useRef(selectRows);
  selectRowsRef.current = selectRows;
  const idOfRef = useRef(idOf);
  idOfRef.current = idOf;

  const [rows, setRows] = useState<T[]>([]);
  const [pagination, setPagination] = useState<AdminPaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(searchInput);
  const [lastSearch, setLastSearch] = useState(debouncedSearch);

  if (debouncedSearch !== lastSearch) {
    setLastSearch(debouncedSearch);
    setPage(1);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetcherRef.current({
          search: debouncedSearch.trim(),
          status: statusFilter,
          page,
          limit,
        });
        if (cancelled) return;
        setRows(selectRowsRef.current(payload));
        setPagination(payload.pagination);
      } catch (err) {
        if (cancelled) return;
        setError((err as Error).message || errorMessage);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, statusFilter, page, limit, reloadToken, errorMessage]);

  const updateRow = useCallback((rowId: string, patch: Partial<T>) => {
    setRows((prev) =>
      prev.map((row) => (idOfRef.current(row) === rowId ? { ...row, ...patch } : row))
    );
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((row) => idOfRef.current(row) !== rowId));
    setPagination((prev) => {
      if (!prev) return prev;
      const total = Math.max(0, prev.total - 1);
      const totalPages = Math.max(1, Math.ceil(total / prev.limit));
      setPage((current) => Math.min(current, totalPages));
      return { ...prev, total, totalPages };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearchInput('');
    setStatusFilter('all');
    setPage(1);
  }, []);

  return {
    rows,
    pagination,
    loading,
    error,
    statusFilter,
    searchInput,
    reload: useCallback(() => setReloadToken((n) => n + 1), []),
    setSearchInput: useCallback((value: string) => setSearchInput(value), []),
    setStatusFilter: useCallback((value: string) => {
      setStatusFilter(value);
      setPage(1);
    }, []),
    setPage,
    updateRow,
    removeRow,
    clearFilters,
  };
}

export default useAdminList;
