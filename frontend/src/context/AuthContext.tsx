import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { clearStoredAuth } from '../api/client';
import { User, RegisterPayload, LoginPayload, AuthResponse } from '../types';
import * as authService from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  register: (payload: RegisterPayload) => Promise<void>;
  login: (payload: LoginPayload) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleAuthCleared = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('ardd-auth-cleared', handleAuthCleared);
    return () => window.removeEventListener('ardd-auth-cleared', handleAuthCleared);
  }, []);

  // Initialize from localStorage, then verify the token with the API.
  useEffect(() => {
    const initializeAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const shouldResetAuth = params.get('resetAuth') === '1';
      if (shouldResetAuth) {
        clearStoredAuth();
        setToken(null);
        setUser(null);
        params.delete('resetAuth');
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}${window.location.hash}`;
        window.history.replaceState(null, '', nextUrl);
        setLoading(false);
        return;
      }

      const savedToken = localStorage.getItem('ardd_token');
      const savedUser = localStorage.getItem('ardd_user');

      if (!savedToken || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          // Token came back without a usable user — treat as invalid.
          throw new Error('Invalid /users/me payload');
        }
        setUser(currentUser);
        localStorage.setItem('ardd_user', JSON.stringify(currentUser));
      } catch {
        clearStoredAuth();
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }
  }, [token]);

  const saveSession = (response: AuthResponse) => {
    const { access_token, user } = response;
    setToken(access_token);
    setUser(user);
    localStorage.setItem('ardd_token', access_token);
    localStorage.setItem('ardd_user', JSON.stringify(user));
  };

  const register = async (payload: RegisterPayload) => {
    await authService.register(payload);
  };

  const login = async (payload: LoginPayload) => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
    // Service handles the form-urlencoded encoding required by
    // FastAPI's OAuth2PasswordRequestForm — don't recreate that here.
    const response = await authService.login(payload);
    saveSession(response);
  };

  const googleLogin = async (credential: string) => {
    const response = await authService.googleLogin(credential);
    saveSession(response);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
  };

  const refreshUser = async () => {
    if (!token) return;
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) return;
    setUser(currentUser);
    localStorage.setItem('ardd_user', JSON.stringify(currentUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, googleLogin, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
