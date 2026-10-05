'use client';

import { forwardRef, type InputHTMLAttributes, useId, useState } from 'react';
import { motion } from 'framer-motion';

const inputVariants = (
  size: 'sm' | 'md' | 'lg',
  withIcon: boolean,
  withRightIcon: boolean
) => {
  const base = 'w-full neu-input text-white placeholder:text-white/50 transition-all duration-200 ease-out focus-visible:outline-none';
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg min-h-[44px]',
    md: 'px-4 py-3 text-base rounded-xl min-h-[50px]',
    lg: 'px-5 py-4 text-lg rounded-xl min-h-[56px]',
  };
  return `${base} ${sizeClasses[size]} ${withIcon ? 'pl-12' : ''} ${withRightIcon ? 'pr-12' : ''}`;
};

const labelVariants = (required: boolean) =>
  `block text-sm font-medium text-white/95 mb-2 transition-colors duration-200 ${required ? 'after:content-["*"] after:ml-1 after:text-accent' : ''}`;

type MotionConflictKeys =
  | 'onDrag'
  | 'onDragStart'
  | 'onDragEnd'
  | 'onAnimationStart'
  | 'onAnimationEnd'
  | 'onAnimationIteration'
  | 'onTransitionEnd';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | MotionConflictKeys> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      showPasswordToggle = false,
      size = 'md',
      containerClassName = '',
      id: providedId,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;
    const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputType = showPasswordToggle && type === 'password' ? (showPassword ? 'text' : 'password') : type;

    const baseInputClass = inputVariants(size, !!leftIcon, !!(rightIcon || showPasswordToggle));
    const combinedInputClass = `${baseInputClass} ${className}`;

    const hasError = !!error;

    return (
      <div className={`relative ${containerClassName}`}>
        {label && (
          <label htmlFor={id} className={labelVariants(!!props.required)}>
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <motion.div
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none flex items-center justify-center"
              aria-hidden="true"
              animate={{ scale: isFocused ? 1.1 : 1, color: isFocused ? '#7c6cff' : 'rgba(255,255,255,0.5)' }}
              transition={{ duration: 200 }}
            >
              {leftIcon}
            </motion.div>
          )}

          <motion.input
            ref={ref}
            id={id}
            type={inputType}
            className={combinedInputClass}
            aria-invalid={hasError}
            aria-describedby={describedBy}
            aria-errormessage={hasError ? errorId : undefined}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            whileFocus={{ scale: 1.002, borderColor: '#7c6cff', boxShadow: 'var(--shadow-neu-inset), 0 0 0 3px rgba(124, 108, 255, 0.35)' }}
            whileTap={{ scale: 0.998 }}
            {...props}
          />

          {(rightIcon || showPasswordToggle) && (
            <div
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
              aria-hidden={showPasswordToggle ? undefined : true}
            >
              {showPasswordToggle ? (
                <motion.button
                  type="button"
                  className="touch-target p-1 text-white/60 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={showPassword}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.1 }}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </motion.button>
              ) : rightIcon ? (
                <span className="text-white/50">{rightIcon}</span>
              ) : null}
            </div>
          )}
        </div>

        {hasError && (
          <motion.p
            id={errorId}
            className="mt-2 text-sm text-red-400 flex items-center gap-1"
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </motion.p>
        )}

        {hint && !hasError && (
          <motion.p
            id={hintId}
            className="mt-2 text-sm text-white/50"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {hint}
          </motion.p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export type { InputProps };