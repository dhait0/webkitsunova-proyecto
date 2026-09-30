import { type HTMLAttributes, forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';

const gridVariants = cva(
  'grid gap-4 sm:gap-6 lg:gap-8',
  {
    variants: {
      cols: {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
        auto: 'grid-cols-[repeat(auto-fit,minmax(280px,1fr))]',
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-3 sm:gap-4',
        md: 'gap-4 sm:gap-6',
        lg: 'gap-6 sm:gap-8',
        xl: 'gap-8 sm:gap-10',
      },
    },
    defaultVariants: {
      cols: 3,
      gap: 'md',
    },
  }
);

type GridGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type GridCols = 1 | 2 | 3 | 4 | 5 | 'auto';

interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridCols;
  gap?: GridGap;
  stagger?: number;
  children: React.ReactNode;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ className = '', cols = 3, gap = 'md', stagger = 0.1, children, ...props }, ref) => {
    const baseClass = gridVariants({ cols, gap });
    const combinedClass = `${baseClass} ${className}`;

    return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
  }
);

Grid.displayName = 'Grid';

const flexVariants = cva(
  'flex items-center',
  {
    variants: {
      direction: {
        row: 'flex-row',
        col: 'flex-col',
        rowReverse: 'flex-row-reverse',
        colReverse: 'flex-col-reverse',
      },
      justify: {
        start: 'justify-start',
        center: 'justify-center',
        end: 'justify-end',
        between: 'justify-between',
        around: 'justify-around',
        evenly: 'justify-evenly',
      },
      align: {
        start: 'items-start',
        center: 'items-center',
        end: 'items-end',
        stretch: 'items-stretch',
        baseline: 'items-baseline',
      },
      wrap: {
        true: 'flex-wrap',
        false: 'flex-nowrap',
      },
      gap: {
        none: 'gap-0',
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-6',
        xl: 'gap-8',
      },
    },
    defaultVariants: {
      direction: 'row',
      justify: 'start',
      align: 'center',
      wrap: false,
      gap: 'md',
    },
  }
);

type FlexDirection = 'row' | 'col' | 'rowReverse' | 'colReverse';
type FlexJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
type FlexAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
type FlexGap = 'none' | 'sm' | 'md' | 'lg' | 'xl';

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: FlexDirection;
  justify?: FlexJustify;
  align?: FlexAlign;
  wrap?: boolean;
  gap?: FlexGap;
  asChild?: boolean;
}

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className = '',
      direction = 'row',
      justify = 'start',
      align = 'center',
      wrap = false,
      gap = 'md',
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClass = flexVariants({ direction, justify, align, wrap, gap });
    const combinedClass = `${baseClass} ${className}`;

    if (asChild) {
      return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
    }

    return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
  }
);

Flex.displayName = 'Flex';

export { gridVariants, flexVariants };
export type { GridProps, FlexProps };