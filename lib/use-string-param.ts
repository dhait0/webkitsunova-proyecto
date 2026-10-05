'use client';

import { useParams } from 'next/navigation';

/**
 * `useParams` in the App Router types each value as `string | string[]`, but a
 * route segment can only ever be a single value. Normalizing here keeps the
 * coercion out of every page.
 */
export function useStringParam(name: string): string {
  const params = useParams<Record<string, string | string[] | undefined>>();
  const value = params[name];

  if (Array.isArray(value)) {
    return value[0] ?? '';
  }

  return value ?? '';
}
