import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HomeIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Profile', href: '/profile', icon: UserIcon },
  ];

  const isActive = (href) => location.pathname === href;

  return (
    <nav className="bg-background shadow-sm border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/dashboard" className="text-xl font-bold text-primary">
                StudyGroup Finder
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200",
                      isActive(item.href)
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    )}
                    onClick={() => {
                      if(item.name === "Profile") {
                        localStorage.setItem("profileRefresh", Date.now());
                      }
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-foreground">
                Welcome, {localStorage.getItem("name")?.split(" ")[0]}
              </span>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
          
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary transition-colors duration-200"
            >
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="sm:hidden bg-card border-t">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "block pl-3 pr-4 py-2 border-l-4 text-base font-medium transition-colors duration-200",
                    isActive(item.href)
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:bg-muted/50 hover:border-border hover:text-foreground"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center">
                    <Icon className="h-4 w-4 mr-3" />
                    {item.name}
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="pt-4 pb-3 border-t">
            <div className="flex items-center justify-between px-4">
              <div className="text-base font-medium text-foreground">
                {user?.firstName} {user?.lastName}
              </div>
              <button
                onClick={toggleTheme}
                className="inline-flex items-center p-2 border border-transparent text-sm leading-4 font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="block px-4 py-2 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full text-left transition-colors duration-200"
              >
                <div className="flex items-center">
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Logout
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
