import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

const ToastContext = React.createContext();

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = React.useState([]);

  const addToast = React.useCallback((toast) => {
    const id = Date.now().toString();
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    if (toast.duration !== 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration || 5000);
    }
    
    return id;
  }, []);

  const removeToast = React.useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const updateToast = React.useCallback((id, updates) => {
    setToasts(prev => 
      prev.map(toast => 
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  const value = {
    toasts,
    addToast,
    removeToast,
    updateToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const Toast = ({ toast, onRemove }) => {
  const variants = {
    success: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
      className: 'bg-success text-white',
    },
    error: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
      className: 'bg-error text-white',
    },
    warning: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      className: 'bg-warning text-white',
    },
    info: {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      className: 'bg-primary text-white',
    },
  };

  const { icon, className } = variants[toast.variant] || variants.info;

  return (
    <motion.div
      className={cn(
        'pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-strong min-w-[300px] max-w-md',
        className
      )}
      initial={{ 
        opacity: 0, 
        x: 100,
        scale: 0.9
      }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: 1
      }}
      exit={{ 
        opacity: 0, 
        x: 100,
        scale: 0.9,
        transition: { duration: 0.2 }
      }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30
      }}
    >
      <div className="flex-shrink-0">
        {icon}
      </div>
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-medium text-sm">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm opacity-90 mt-0.5">{toast.description}</p>
        )}
      </div>
      
      {toast.action && (
        <div className="flex-shrink-0">
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium hover:opacity-80 transition-opacity"
          >
            {toast.action.label}
          </button>
        </div>
      )}
      
      {toast.duration !== 0 && (
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 ml-2 hover:opacity-80 transition-opacity"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
};

// Convenience functions - these should be used within React components
// Use the useToast hook instead which provides the addToast function
export const useToastMethods = () => {
  const { addToast } = useToast();
  
  return React.useMemo(() => ({
    success: (title, description, options = {}) => {
      return addToast({ title, description, variant: 'success', ...options });
    },
    error: (title, description, options = {}) => {
      return addToast({ title, description, variant: 'error', ...options });
    },
    warning: (title, description, options = {}) => {
      return addToast({ title, description, variant: 'warning', ...options });
    },
    info: (title, description, options = {}) => {
      return addToast({ title, description, variant: 'info', ...options });
    }
  }), [addToast]);
};

// For backward compatibility, but should be used within components
export const toast = {
  success: (title, description, options = {}) => {
    console.warn('Direct toast usage outside of React component is deprecated. Use useToast hook instead.');
    // This won't work but provides a warning
  },
  error: (title, description, options = {}) => {
    console.warn('Direct toast usage outside of React component is deprecated. Use useToast hook instead.');
  },
  warning: (title, description, options = {}) => {
    console.warn('Direct toast usage outside of React component is deprecated. Use useToast hook instead.');
  },
  info: (title, description, options = {}) => {
    console.warn('Direct toast usage outside of React component is deprecated. Use useToast hook instead.');
  }
};

export default Toast;
