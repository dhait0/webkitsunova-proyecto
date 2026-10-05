'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ToastTone } from '@/components/admin/types';

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

const TOAST_TIMEOUT_MS = 4000;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone) => {
      const id = nextId.current;
      nextId.current += 1;

      setToasts((prev) => [...prev, { id, message, tone }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_TIMEOUT_MS)
      );
    },
    [dismiss]
  );

  return {
    toasts,
    dismiss,
    success: useCallback((message: string) => push(message, 'success'), [push]),
    error: useCallback((message: string) => push(message, 'error'), [push]),
  };
}

export default useToasts;
