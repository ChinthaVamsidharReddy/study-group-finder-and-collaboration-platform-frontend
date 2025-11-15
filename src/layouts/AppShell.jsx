import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Outlet } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Calendar, 
  MessageSquare, 
  Settings,
  Bell,
  Search,
  User
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ToastProvider } from '../components/ui/Toast';

const AppShell = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Groups', href: '/groups', icon: Users },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const sidebarVariants = {
    open: {
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: {
      x: -300,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  const overlayVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0 }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        {/* Mobile Sidebar Overlay */}
        <AnimatePresence>
          {sidebarOpen && isMobile && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
              variants={overlayVariants}
              initial="closed"
              animate="open"
              exit="closed"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || !isMobile) && (
            <motion.aside
              className={cn(
                "fixed top-0 left-0 h-full w-72 bg-card border-r border-border z-50",
                "md:relative md:z-auto"
              )}
              variants={sidebarVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <div className="flex flex-col h-full">
                {/* Logo */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SG</span>
                    </div>
                    <h1 className="text-xl font-bold text-foreground">StudyHub</h1>
                  </div>
                  {isMobile && (
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <a
                        key={item.name}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200",
                          "hover:bg-primary/10 hover:text-primary",
                          "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.name}</span>
                      </a>
                    );
                  })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-border">
                  <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">John Doe</p>
                      <p className="text-xs text-muted-foreground truncate">john@example.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={cn("flex-1", !isMobile && "md:ml-0")}>
          {/* Header */}
          <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center space-x-4">
                {isMobile && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                )}
                
                {/* Search Bar */}
                <div className="relative max-w-md hidden md:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search groups, sessions, people..."
                    className="w-full pl-10 pr-4 py-2 bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                </button>

                {/* User Menu */}
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="p-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Outlet />
            </motion.div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};

export default AppShell;
