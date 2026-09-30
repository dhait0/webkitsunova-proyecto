import { type HTMLAttributes, forwardRef } from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const containerVariants = cva(
  'mx-auto px-4 sm:px-6 lg:px-8',
  {
    variants: {
      size: {
        sm: 'max-w-3xl',
        md: 'max-w-5xl',
        lg: 'max-w-6xl',
        xl: 'max-w-7xl',
        full: 'max-w-full',
      },
      fluid: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      size: 'lg',
      fluid: false,
    },
  }
);

interface ContainerProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof containerVariants> {
  asChild?: boolean;
}

export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ className = '', size = 'lg', fluid = false, asChild = false, children, ...props }, ref) => {
    const baseClass = containerVariants({ size, fluid });
    const combinedClass = `${baseClass} ${className}`;

    if (asChild) {
      return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
    }

    return <div ref={ref} className={combinedClass} {...props}>{children}</div>;
  }
);

Container.displayName = 'Container';

const sectionVariants = cva(
  'relative w-full',
  {
    variants: {
      padding: {
        none: '',
        sm: 'py-10 sm:py-12',
        md: 'py-14 sm:py-16 lg:py-20',
        lg: 'py-16 sm:py-20 lg:py-24 xl:py-28',
        xl: 'py-20 sm:py-24 lg:py-32 xl:py-36',
      },
      background: {
        none: '',
        neu: 'bg-neu-bg',
        gradient: 'bg-gradient-to-b from-neu-light to-neu-bg',
        dark: 'bg-neu-dark',
        subtle: 'bg-white/5',
      },
      divider: {
        none: '',
        top: 'border-t border-white/10',
        bottom: 'border-b border-white/10',
        both: 'border-y border-white/10',
      },
      reveal: {
        true: 'reveal-section',
        false: '',
      },
    },
    defaultVariants: {
      padding: 'md',
      background: 'none',
      divider: 'none',
      reveal: true,
    },
  }
);

type SectionTag = 'section' | 'div' | 'header' | 'footer' | 'main' | 'article';

interface SectionProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof sectionVariants> {
  as?: SectionTag;
  containerSize?: ContainerProps['size'];
  containerFluid?: boolean;
}

export const Section = forwardRef<HTMLDivElement, SectionProps>(
  (
    {
      className = '',
      padding = 'md',
      background = 'none',
      divider = 'none',
      reveal = true,
      as: Component = 'section',
      containerSize = 'lg',
      containerFluid = false,
      children,
      ...props
    },
    ref
  ) => {
    const { ref: revealRef, isVisible } = useScrollReveal();
    const baseClass = sectionVariants({ padding, background, divider, reveal });
    const revealClass = reveal ? (isVisible ? ' visible' : ' reveal-pending') : '';
    const combinedClass = `${baseClass}${revealClass} ${className}`;

    const setRef = (node: HTMLDivElement | null) => {
      (revealRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    return (
      <Component ref={setRef} className={combinedClass} {...props}>
        <Container size={containerSize} fluid={containerFluid}>
          {children}
        </Container>
      </Component>
    );
  }
);

Section.displayName = 'Section';

export { containerVariants, sectionVariants };
export type { ContainerProps, SectionProps };