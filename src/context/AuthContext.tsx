'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/types';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, fullName: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  resendVerification: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'luxe_auth_token';
const USER_KEY = 'luxe_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const savedUser = localStorage.getItem(USER_KEY);

        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validate token with the server
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        } else {
          // Token invalid/expired - clear session
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
        }
      } catch (e) {
        // Network error - fall back to cached user if available
        try {
          const savedUser = localStorage.getItem(USER_KEY);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
        } catch {
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          // Handle email verification required
          if (data.requiresVerification) {
            showToast({
              type: 'warning',
              title: 'Email Verification Required',
              message: 'Please verify your email before logging in. Check your inbox or use the link below.',
            });
            return false;
          }
          showToast({
            type: 'error',
            title: 'Sign In Failed',
            message: data.error || 'Unable to sign in. Please try again.',
          });
          return false;
        }

        setUser(data.user);
        localStorage.setItem(TOKEN_KEY, data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        showToast({
          type: 'success',
          title: 'Welcome Back',
          message: `Signed in as ${data.user.fullName} (${data.user.role.toUpperCase()})`,
        });

        // Handle role-based redirect
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        }
        return true;
      } catch (e) {
        showToast({
          type: 'error',
          title: 'Sign In Failed',
          message: 'Network error. Please check your connection and try again.',
        });
        return false;
      }
    },
    [showToast]
  );

  const register = useCallback(
    async (email: string, fullName: string, password: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, fullName, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast({
            type: 'error',
            title: 'Registration Failed',
            message: data.error || 'Unable to create your account. Please try again.',
          });
          return false;
        }

        // Registration succeeded — user must verify email before logging in.
        // Do NOT set token or user in localStorage.
        showToast({
          type: 'success',
          title: 'Account Created',
          message: 'Please check your email to verify your account.',
        });

        return true;
      } catch (e) {
        showToast({
          type: 'error',
          title: 'Registration Failed',
          message: 'Network error. Please check your connection and try again.',
        });
        return false;
      }
    },
    [showToast]
  );

  const resendVerification = useCallback(
    async (email: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/resend-verification', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          showToast({
            type: 'error',
            title: 'Error',
            message: data.error || 'Unable to resend verification email. Please try again.',
          });
          return false;
        }

        showToast({
          type: 'success',
          title: 'Verification Email Sent',
          message: data.message || 'If the account exists and requires verification, a verification email has been sent.',
        });

        return true;
      } catch (e) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'Network error. Please check your connection and try again.',
        });
        return false;
      }
    },
    [showToast]
  );

  const logout = useCallback(async () => {
    // If the user was an admin, destroy the admin session cookie too
    if (user?.role === 'admin') {
      try {
        await fetch('/api/admin/logout', { method: 'POST' });
      } catch {
        // Ignore - still clear local state
      }
    }
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear the user session cookie used by middleware
    document.cookie = 'luxe_auth_token=; path=/; max-age=0; SameSite=Lax';
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out.',
    });
  }, [user, showToast]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const res = await fetch('/api/auth/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ fullName: updates.fullName, phone: updates.phone, avatarUrl: updates.avatarUrl }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Unable to update profile');
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        showToast({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your personal information was saved.',
        });
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Profile',
          message: error instanceof Error ? error.message : 'Unable to update profile.',
        });
      }
    },
    [user, showToast]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
