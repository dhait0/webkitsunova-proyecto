import type { ReactNode } from 'react';

/**
 * Builds the WebP source for a raster asset, or null when the asset has no
 * WebP sibling. Callers should keep the original file as the `<img>` fallback
 * so the markup still works if the WebP variant is missing.
 */
export function webpSource(src: string): string | null {
  if (!/\.(png|jpe?g)$/i.test(src)) return null;
  return src.replace(/\.(png|jpe?g)$/i, '.webp');
}

interface PictureImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync' | 'auto';
}

/**
 * `<picture>` with an optional WebP source. Intrinsic width/height are always
 * emitted so the browser can reserve the box and avoid layout shift.
 */
export function PictureImage({
  src,
  alt,
  className,
  width,
  height,
  loading = 'lazy',
  fetchPriority,
  decoding = 'async',
}: PictureImageProps): ReactNode {
  const webp = webpSource(src);

  const img = (
    <img
      src={src}
      alt={alt}
      className={className}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      {...(fetchPriority ? ({ fetchpriority: fetchPriority } as Record<string, unknown>) : {})}
    />
  );

  if (!webp) return img;

  return (
    <picture>
      <source type="image/webp" srcSet={webp} />
      {img}
    </picture>
  );
}
