import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import client, { clearStoredAuth } from '../api/client';
import { User, RegisterPayload, LoginPayload, AuthResponse } from '../types';

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
      const savedToken = localStorage.getItem('ardd_token');
      const savedUser = localStorage.getItem('ardd_user');

      if (!savedToken || !savedUser) {
        setLoading(false);
        return;
      }

      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        const response = await client.get<User>('/users/me');
        setUser(response.data);
        localStorage.setItem('ardd_user', JSON.stringify(response.data));
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
    await client.post('/auth/register', payload);
  };

  const login = async (payload: LoginPayload) => {
    // Send as form data for OAuth2PasswordRequestForm
    const formData = new URLSearchParams();
    formData.append('username', payload.username);
    formData.append('password', payload.password);

    const response = await client.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    saveSession(response.data);
  };

  const googleLogin = async (credential: string) => {
    const response = await client.post<AuthResponse>('/auth/google', { credential });
    saveSession(response.data);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
  };

  const refreshUser = async () => {
    if (!token) return;
    const response = await client.get<User>('/users/me');
    setUser(response.data);
    localStorage.setItem('ardd_user', JSON.stringify(response.data));
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
