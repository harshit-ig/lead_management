import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { LoginCredentials } from '../types';
import { Lock, Mail, AlertCircle, Eye, EyeOff, Users } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(credentials);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lead Manager</h1>
                <p className="text-sm text-gray-500">Management Portal</p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to your account to continue
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="form-input pl-10"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="form-input pl-10 pr-10"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary btn-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-spinner mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in to Dashboard'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Demo Credentials</h4>
                <div className="text-xs text-blue-700 space-y-1">
                  <div>
                    <p><strong>Admin:</strong> admin@leadmanager.com / admin123456</p>
                    <p><strong>User:</strong> user@leadmanager.com / user123456</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Brand Section */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full flex flex-col justify-center items-center p-12 text-white">
            <div className="max-w-md text-center">
              <h3 className="text-3xl font-bold mb-4">
                Manage Your Leads Efficiently
              </h3>
              <p className="text-xl text-blue-100 mb-8">
                Powerful lead management system to track, assign, and convert prospects into customers
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold">∞</div>
                  <div className="text-blue-100">Unlimited Leads</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-blue-100">User Roles</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-blue-100">Trackable</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-2xl font-bold">24/7</div>
                  <div className="text-blue-100">Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
