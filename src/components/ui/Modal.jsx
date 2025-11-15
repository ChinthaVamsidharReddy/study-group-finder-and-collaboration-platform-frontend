import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const Modal = React.forwardRef(({ 
  isOpen, 
  onClose, 
  children, 
  className,
  size = 'md',
  closeOnBackdrop = true,
  showCloseButton = true,
  ...props 
}, ref) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          
          {/* Modal Content */}
          <motion.div
            ref={ref}
            className={cn(
              'relative bg-card border border-border rounded-2xl shadow-strong max-h-[90vh] overflow-hidden',
              'w-full',
              sizeClasses[size],
              className
            )}
            initial={{ 
              opacity: 0, 
              scale: 0.95,
              y: 20 
            }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: 0
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.95,
              y: 20
            }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.2
            }}
            onClick={(e) => e.stopPropagation()}
            {...props}
          >
            {/* Close Button */}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
                aria-label="Close modal"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            
            {/* Modal Content */}
            <div className="max-h-[90vh] overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

Modal.displayName = 'Modal';

const ModalHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-4 border-b border-border", className)}
    {...props}
  />
));
ModalHeader.displayName = "ModalHeader";

const ModalTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-xl font-semibold text-foreground", className)}
    {...props}
  />
));
ModalTitle.displayName = "ModalTitle";

const ModalDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1", className)}
    {...props}
  />
));
ModalDescription.displayName = "ModalDescription";

const ModalContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-4", className)}
    {...props}
  />
));
ModalContent.displayName = "ModalContent";

const ModalFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("px-6 py-4 border-t border-border flex items-center justify-end gap-3", className)}
    {...props}
  />
));
ModalFooter.displayName = "ModalFooter";

export { Modal, ModalHeader, ModalTitle, ModalDescription, ModalContent, ModalFooter };
