import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({
  children,
  className = '',
  shadow = true,
  hover = false,
  onClick,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={[
        'rounded-xl bg-white p-4',
        shadow ? 'shadow-sm' : '',
        hover ? 'transition-shadow hover:shadow-md cursor-pointer' : '',
        onClick ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  );
}
