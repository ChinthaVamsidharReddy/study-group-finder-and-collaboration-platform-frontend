import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Input = forwardRef(({ 
  className, 
  type = 'text',
  error,
  success,
  label,
  helperText,
  icon,
  iconPosition = 'left',
  disabled = false,
  ...props 
}, ref) => {
  const MotionInput = motion.input;
  
  const inputClasses = cn(
    'input-field',
    error && 'input-field-error',
    success && 'input-field-success',
    icon && iconPosition === 'left' && 'pl-12',
    icon && iconPosition === 'right' && 'pr-12',
    disabled && 'opacity-50 cursor-not-allowed',
    className
  );

  return (
    <div className="relative w-full">
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        
        <MotionInput
          type={type}
          className={inputClasses}
          ref={ref}
          disabled={disabled}
          whileFocus={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      
      {(error || success || helperText) && (
        <p className={cn(
          'mt-2 text-sm',
          error && 'text-error',
          success && 'text-success',
          !error && !success && 'text-muted-foreground'
        )}>
          {error || success || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
