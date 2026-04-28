'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { User, AuthTokens, authAPI, apiClient, LoginData, RegisterData, LoginResponse, RegisterResponse } from '@/lib/auth';

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
  const pathname = usePathname();

  const isAuthenticated = !!user;

  const isAuthPage = pathname === '/login' || pathname === '/register';

  useEffect(() => {
    const initAuth = async () => {
      try {
        
        const currentUser = apiClient.getCurrentUser();
        
        if (currentUser) {
          console.log('Auth: Found stored user:', currentUser);
          setUser(currentUser);
        } else {
          console.log('Auth: No stored user found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        
        await apiClient.logout();
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthPage) {
      setIsLoading(false);
    }

    initAuth();
  }, [pathname]); 

  const login = async (data: LoginData) => {
    try {
      const response = await authAPI.login(data);
      
      setUser(response.user);
      return response; 
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authAPI.register(data);
      
      setUser(response.user);
      return response; 
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    try {
      const profile = await authAPI.getProfile();
      
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
