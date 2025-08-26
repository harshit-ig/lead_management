import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../lib/api';
import type { AuthState, User, LoginCredentials } from '../types';
import toast from 'react-hot-toast';

// Action types
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
};

// Context interface
interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await authApi.login(credentials);

      if (response.success && response.data) {
        const { user, token } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user, token } 
        });

        toast.success(`Welcome back, ${user.name}!`);
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      const message = error instanceof Error ? error.message : 'Login failed';
      toast.error(message);
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      // Call logout API (optional - for server-side token cleanup)
      await authApi.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  // Check authentication status
  const checkAuth = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token || !userStr) {
        dispatch({ type: 'LOGIN_FAILURE' });
        return;
      }

      // Verify token with server
      const response = await authApi.me();

      if (response.success && response.data) {
        // Update user data from server
        const user = response.data;
        localStorage.setItem('user', JSON.stringify(user));

        dispatch({ 
          type: 'LOGIN_SUCCESS', 
          payload: { user, token } 
        });
      } else {
        // Token is invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    } catch (error) {
      // Token verification failed
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
