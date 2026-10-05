'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks which anchor section is currently the most visible one so the header
 * can highlight it. Falls back to the first id until a section is observed.
 */
export function useActiveSection(ids: readonly string[], offset = 120): string {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? '');

  useEffect(() => {
    if (ids.length === 0) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const visible = new Map<string, number>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }

        let bestId = '';
        let bestRatio = 0;

        for (const id of ids) {
          const ratio = visible.get(id) ?? 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }

        if (bestId) setActiveId(bestId);
      },
      { rootMargin: `-${offset}px 0px -55% 0px`, threshold: [0, 0.25, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids, offset]);

  return activeId;
}

/**
 * Smoothly scrolls to an anchor, accounting for the sticky header so the
 * target section is not hidden underneath it.
 */
export function scrollToSection(id: string, offset = 88) {
  const target = document.getElementById(id);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - offset;

  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
}
