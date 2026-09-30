import { forwardRef, type HTMLAttributes } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { PictureImage } from './PictureImage';

const cardVariants = cva(
  'neu-card relative overflow-hidden transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        default: 'p-5',
        feature: 'p-5 flex flex-col',
        benefit: 'p-5 flex flex-col',
        journey: 'p-6 flex flex-col',
        metric: 'p-5 text-center',
        panel: 'p-5',
        auth: 'p-6 sm:p-8',
      },
      hover: {
        true: 'hover:lift-hover',
        false: '',
      },
      padded: {
        true: '',
        false: 'p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      hover: true,
      padded: true,
    },
  }
);

const cardImageVariants = cva(
  'w-full overflow-hidden bg-gradient-to-br from-accent/10 to-accent-2/5 relative',
  {
    variants: {
      ratio: {
        '4/3': 'aspect-[4/3]',
        '16/9': 'aspect-[16/9]',
        '1/1': 'aspect-square',
        '3/2': 'aspect-[3/2]',
      },
      radius: {
        none: '',
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        xl: 'rounded-3xl',
        '2xl': 'rounded-[32px]',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      ratio: '4/3',
      radius: 'lg',
    },
  }
);

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  asChild?: boolean;
  children: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className = '',
      variant = 'default',
      hover = true,
      padded = true,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClass = cardVariants({ variant, hover, padded });
    const combinedClass = `${baseClass} ${className}`;

    if (asChild) {
      return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
    }

    return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
  }
);

Card.displayName = 'Card';

interface CardImageProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardImageVariants> {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  priority?: boolean;
  width?: number;
  height?: number;
}

export const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  (
    {
      className = '',
      src,
      alt,
      fallback,
      priority = false,
      width,
      height,
      ratio = '4/3',
      radius = 'lg',
      ...props
    },
    ref
  ) => {
    const baseClass = cardImageVariants({ ratio, radius });
    const combinedClass = `${baseClass} ${className}`;

    return (
      <div ref={ref} className={combinedClass} {...props}>
        <PictureImage
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        />
        {fallback && (
          <div className="absolute inset-0 flex items-center justify-center bg-neu-bg/50 backdrop-blur-sm">
            {fallback}
          </div>
        )}
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';

export { cardVariants, cardImageVariants };
export type { CardProps, CardImageProps };