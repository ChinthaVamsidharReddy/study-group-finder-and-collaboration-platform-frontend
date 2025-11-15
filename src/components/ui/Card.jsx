import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ 
  className, 
  children, 
  variant = 'default',
  interactive = false,
  glass = false,
  hover = false,
  ...props 
}, ref) => {
  const MotionDiv = motion.div;
  
  const variants = {
    default: 'bg-card border border-border rounded-2xl shadow-soft',
    elevated: 'bg-card border border-border rounded-2xl shadow-medium',
    flat: 'bg-card border border-border rounded-2xl',
    glass: 'glass rounded-2xl shadow-soft',
    gradient: 'gradient-soft border border-border/20 rounded-2xl shadow-soft',
  };

  return (
    <MotionDiv
      className={cn(
        variants[variant],
        glass && variants.glass,
        interactive && 'card-interactive cursor-pointer',
        hover && 'hover:shadow-medium hover:-translate-y-1 transition-all duration-200',
        className
      )}
      ref={ref}
      whileHover={interactive ? { y: -4, transition: { duration: 0.2 } } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      {...props}
    >
      {children}
    </MotionDiv>
  );
});

Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
