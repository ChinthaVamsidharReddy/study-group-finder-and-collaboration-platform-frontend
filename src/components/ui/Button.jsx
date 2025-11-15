import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const buttonVariants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary', 
  ghost: 'btn-ghost',
  destructive: 'bg-error text-white hover:bg-error/90 font-medium px-6 py-3 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white font-medium px-6 py-3 rounded-xl transition-all duration-200',
};

const buttonSizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
  icon: 'p-3',
};

const Button = React.forwardRef(({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  icon,
  children,
  ...props 
}, ref) => {
  const MotionButton = motion.button;
  
  return (
    <MotionButton
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      ref={ref}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {loading && (
        <svg 
          className="animate-spin -ml-1 mr-3 h-5 w-5" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      
      {icon && !loading && (
        <span className="mr-2">{icon}</span>
      )}
      
      {children}
    </MotionButton>
  );
});

Button.displayName = 'Button';

export { Button };
