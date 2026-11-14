import React from 'react';
import { Spinner } from './Spinner';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-[#E8690F] text-white shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 focus-visible:ring-primary',
  secondary:
    'bg-gradient-to-r from-secondary to-[#3a9a3f] text-white shadow-lg shadow-secondary/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-secondary/40 focus-visible:ring-secondary',
  danger:
    'bg-red-600 text-white shadow-lg shadow-red-500/30 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-red-500/40 focus-visible:ring-red-500',
  ghost:
    'border border-primary/30 bg-white/60 text-primary hover:bg-primary/10 focus-visible:ring-primary',
};

const spinnerColor: Record<ButtonVariant, string> = {
  primary: '!text-white',
  secondary: '!text-white',
  danger: '!text-white',
  ghost: 'text-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {loading && <Spinner size="sm" className={spinnerColor[variant]} />}
      {children}
    </button>
  );
}
