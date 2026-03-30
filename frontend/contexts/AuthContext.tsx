'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, AuthTokens, authAPI, tokenManager, LoginData, RegisterData, LoginResponse, RegisterResponse } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<LoginResponse>;
  register: (data: RegisterData) => Promise<RegisterResponse>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const tokens = tokenManager.getTokens();
        const storedUser = tokenManager.getUser();
        
        if (tokens && storedUser) {
          // Verify token is still valid
          if (!tokenManager.isTokenExpired(tokens.access)) {
            setUser(storedUser);
          } else {
            // Try to refresh the token
            try {
              const newTokens = await authAPI.refreshToken(tokens.refresh);
              tokenManager.setTokens(newTokens, storedUser);
              setUser(storedUser);
            } catch {
              // Refresh failed, clear tokens
              tokenManager.clearTokens();
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        tokenManager.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      tokenManager.setTokens(response.tokens, response.user);
      setUser(response.user);
      return response; // Return the response for immediate access to user data
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      tokenManager.setTokens(response.tokens, response.user);
      setUser(response.user);
      return response; // Return the response for immediate access to user data
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const tokens = tokenManager.getTokens();
      if (tokens) {
        await authAPI.logout(tokens.refresh);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenManager.clearTokens();
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      tokenManager.setTokens(tokenManager.getTokens()!, profile);
      setUser(profile);
    } catch (error) {
      console.error('Profile refresh error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
