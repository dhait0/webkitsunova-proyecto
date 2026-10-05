'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { type VariantProps, cva } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-neu-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
  {
    variants: {
      variant: {
        primary: 'neu-btn-primary text-white min-h-[50px] px-6',
        secondary: 'neu-btn-secondary text-white min-h-[48px] px-5',
        ghost: 'bg-transparent border border-white/15 text-white min-h-[48px] px-5 hover:bg-white/10',
        social: 'neu-btn-secondary text-[#1a1a2e] min-h-[50px] px-5 font-bold',
        link: 'text-accent-2 hover:text-accent underline-offset-2 hover:underline px-0 min-h-auto',
      },
      size: {
        sm: 'text-sm px-4 min-h-[40px] rounded-lg',
        md: 'text-base px-5 min-h-[48px] rounded-xl',
        lg: 'text-lg px-7 min-h-[56px] rounded-xl',
        icon: 'p-3 min-h-[44px] min-w-[44px] rounded-xl',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
);

type MotionConflictKeys =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onTransitionEnd';

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, MotionConflictKeys>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClass = buttonVariants({ variant, size, fullWidth });
    const combinedClass = `${baseClass} ${className}`;

    const content = (
      <>
        {loading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : leftIcon ? (
          <span className="mr-2 flex-shrink-0" aria-hidden="true">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading && <span className="ml-2 flex-shrink-0" aria-hidden="true">{rightIcon}</span>}
      </>
    );

    return (
      <motion.button
        ref={ref}
        className={combinedClass}
        disabled={disabled || loading}
        whileTap={{ scale: 0.98, transition: { duration: 100 } }}
        whileHover={variant !== 'link' ? { y: -2, transition: { duration: 150 } } : undefined}
        {...props}
      >
        {content}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { buttonVariants };
export type { ButtonProps };