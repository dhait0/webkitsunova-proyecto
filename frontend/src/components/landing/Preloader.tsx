import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PictureImage } from '@/components/ui';

const EXIT_MS = 1100;
const FADE_MS = 450;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Welcome curtain shown once on first paint. It never blocks reading the page:
 * the rest of the landing is already mounted behind it, and the overlay is
 * skipped entirely when the user prefers reduced motion.
 */
export function Preloader() {
  const reduced = prefersReducedMotion();
  const [visible, setVisible] = useState(!reduced);

  useEffect(() => {
    if (!visible) return;

    document.body.style.overflow = 'hidden';

    const timer = window.setTimeout(() => setVisible(false), EXIT_MS);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = '';
    };
  }, [visible]);

  // Leaving the overlay must hand the scroll back even on unmount.
  useEffect(() => () => {
    document.body.style.overflow = '';
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          className="preloader"
          role="status"
          aria-live="polite"
          aria-label="Cargando Kitsunova"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_MS / 1000, ease: 'easeOut' }}
        >
          <motion.div
            className="preloader-inner"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <PictureImage
              src="/brand/imagotipo.png"
              alt="Kitsunova"
              width={400}
              height={160}
              loading="eager"
              className="preloader-logo"
            />

            <div className="preloader-track" aria-hidden="true">
              <motion.div
                className="preloader-bar"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: EXIT_MS / 1000, ease: 'easeInOut' }}
              />
            </div>

            <p className="preloader-caption">Acompañamiento especializado en hábitos</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
