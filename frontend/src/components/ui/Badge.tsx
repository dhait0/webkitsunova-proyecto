import { type VariantProps, cva } from 'class-variance-authority';

const badgeVariants = cva(
  'inline-flex items-center justify-center font-mono font-semibold transition-all duration-200 ease-out',
  {
    variants: {
      variant: {
        step: 'neu-badge-step min-w-[52px] min-h-[52px] text-lg rounded-xl',
        stepSm: 'neu-badge-step min-w-[40px] min-h-[40px] text-base rounded-lg',
        label: 'px-3 py-1 text-xs rounded-full border border-white/10',
        status: 'px-3 py-1.5 text-xs rounded-full font-medium',
        dot: 'w-2 h-2 rounded-full',
      },
      color: {
        default: 'bg-white/5 text-white/70 border-white/10',
        accent: 'bg-gradient-to-br from-accent/20 to-accent-2/20 text-accent-2 border-accent/30',
        success: 'bg-success/15 text-success border-success/30',
        warning: 'bg-warning/15 text-warning border-warning/30',
        error: 'bg-error/15 text-error border-error/30',
        neutral: 'bg-white/5 text-white/70 border-white/10',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
      },
    },
    defaultVariants: {
      variant: 'label',
      color: 'default',
      size: 'md',
    },
    compoundVariants: [
      { variant: 'step', color: 'accent', className: 'shadow-neu-inset' },
      { variant: 'step', color: 'default', className: 'shadow-neu-inset' },
    ],
  }
);

type BadgeColor = 'default' | 'accent' | 'success' | 'warning' | 'error' | 'neutral';
type BadgeVariant = 'step' | 'stepSm' | 'label' | 'status' | 'dot';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: BadgeSize;
  number?: string | number;
  children?: React.ReactNode;
  className?: string;
}

export function Badge({
  className = '',
  variant = 'label',
  color = 'default',
  size = 'md',
  number,
  children,
  ...props
}: BadgeProps) {
  const baseClass = badgeVariants({ variant, color, size });
  const combinedClass = `${baseClass} ${className}`;

  const content = number !== undefined ? number : children;

  return (
    <span className={combinedClass} {...props}>
      {content}
    </span>
  );
}

export { badgeVariants };
export type { BadgeProps };