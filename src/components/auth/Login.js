import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // TODO: Remove demo accounts when backend is integrated
  // These are for frontend development only
  // const demoAccounts = [
  //   { email: 'student@example.com', password: 'student123', label: 'Student Demo' },
  //   { email: 'teacher@example.com', password: 'teacher123', label: 'Teacher Demo' },
  //   { email: 'admin@example.com', password: 'admin123', label: 'Admin Demo' },
  // ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // const handleDemoAccountClick = (account) => {
  //   setFormData({ email: account.email, password: account.password });
  //   setError('');
  // };

  // TODO: Backend Integration - Login Handler
  // This calls the login function from AuthContext
  // Backend API: POST /api/auth/login
  // Request Body: {email, password}
  // Response: {token, user}
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(formData.email, formData.password);
      if (!result.success) setError(result.error);
      else navigate('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-card p-8 rounded-2xl shadow-lg border">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-center text-foreground mb-2">
            Sign in to your account
          </h2>
          <p className="text-center text-muted-foreground">
            Welcome back! Enter your credentials to access your account.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={cn(
                  "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder-muted-foreground transition-colors",
                  "border-input"
                )}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={cn(
                    "w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground placeholder-muted-foreground transition-colors",
                    "border-input"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:text-primary/80 transition-colors">
            Sign up here
          </Link>
        </p>

        {/* Demo Accounts Section */}
        {/* <div className="mt-8 pt-6 border-t border-gray-200 dark:border-dark-border">
          <p className="text-center text-xs font-medium text-gray-500 dark:text-dark-textSecondary uppercase mb-3">
            🧪 Demo Accounts (for testing)
          </p>
          <div className="grid grid-cols-3 gap-2">
            {demoAccounts.map((account, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDemoAccountClick(account)}
                className="w-full text-left px-3 py-2 text-sm bg-white dark:bg-dark-input border border-blue-200 dark:border-blue-700/50 rounded hover:bg-blue-50 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 transition-colors"
              >
                {account.label}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 dark:text-dark-textSecondary mt-2">
            Click a demo account to auto-fill credentials, then click Sign in
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
