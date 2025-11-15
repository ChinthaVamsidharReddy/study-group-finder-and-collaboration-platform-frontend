import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showTray, setShowTray] = useState(false);
  const [permission, setPermission] = useState('default');

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Deduplication logic - check if notification already exists
  const isDuplicate = useCallback((notification) => {
    return notifications.some(existing => 
      existing.type === notification.type &&
      existing.sessionId === notification.sessionId &&
      existing.offset === notification.offset
    );
  }, [notifications]);

  // Add notification with deduplication
  const addNotification = useCallback((notification) => {
    if (isDuplicate(notification)) {
      return null; // Skip duplicate
    }

    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep max 50

    // Show browser notification if permission granted
    if (permission === 'granted' && !notification.skipBrowser) {
      showBrowserNotification(newNotification);
    }

    return id;
  }, [isDuplicate, permission]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification) => {
    const options = {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `${notification.type}-${notification.sessionId || 'general'}`,
      renotify: true,
      requireInteraction: notification.type === 'error' || notification.type === 'warning'
    };

    try {
      const browserNotification = new Notification(notification.title || 'StudyHub', options);
      
      // Auto-close after 5 seconds for non-error notifications
      if (notification.type !== 'error' && notification.type !== 'warning') {
        setTimeout(() => browserNotification.close(), 5000);
      }

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        if (notification.onClick) {
          notification.onClick();
        }
      };
    } catch (error) {
      console.error('Failed to show browser notification:', error);
    }
  }, []);

  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
    permission,
    requestPermission,
    showTray,
    setShowTray
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationTray />
      <NotificationCenterButton />
    </NotificationContext.Provider>
  );
};

// Notification tray component
const NotificationTray = () => {
  const { notifications, showTray, setShowTray, removeNotification, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case 'success': return <Check className="h-4 w-4 text-success" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-error" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      default: return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success': return 'border-success/20 bg-success/5';
      case 'error': return 'border-error/20 bg-error/5';
      case 'warning': return 'border-warning/20 bg-warning/5';
      default: return 'border-primary/20 bg-primary/5';
    }
  };

  return (
    <AnimatePresence>
      {showTray && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowTray(false)}
          />
          
          {/* Tray */}
          <motion.div
            className="fixed top-16 right-4 w-96 max-h-[500px] bg-card border border-border rounded-2xl shadow-strong z-50 overflow-hidden"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Mark all read
                </button>
                <button
                  onClick={clearAll}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowTray(false)}
                  className="p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      className={cn(
                        'p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                        !notification.read && 'bg-muted/30',
                        getTypeStyles(notification.type)
                      )}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => {
                        markAsRead(notification.id);
                        if (notification.onClick) {
                          notification.onClick();
                        }
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-foreground">
                              {notification.title || 'Notification'}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-muted transition-colors"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Notification center button
const NotificationCenterButton = () => {
  const { unreadCount, setShowTray, permission, requestPermission } = useNotifications();

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <motion.button
        className="relative p-4 bg-primary text-white rounded-full shadow-strong hover:shadow-xl transition-all duration-200"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          if (permission === 'default') {
            requestPermission();
          }
          setShowTray(true);
        }}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 w-6 h-6 bg-error rounded-full flex items-center justify-center text-white text-xs font-bold"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {Math.min(unreadCount, 9)}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
};

export default NotificationProvider;
