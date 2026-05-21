// src/hooks/useAuth-python.tsx
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { authService, UserResponse } from '@/services/auth-service';

type AppRole = 'produtor' | 'engenheiro' | 'admin' | 'mesa_produtos' | 'banco' | 'agrobanker';

interface AuthContextType {
  user: UserResponse | null;
  role: AppRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  signOut: () => void;
  register: (email: string, password: string, nome: string, role: AppRole) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
          // TODO: Get role from backend
          setRole('produtor');
        } catch (error) {
          console.error('Failed to fetch user:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const register = async (email: string, password: string, nome: string, role: AppRole) => {
    await authService.register({
      email,
      password,
      nome,
      role,
    });
    
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    setRole(role);
  };

  const login = async (email: string, password: string) => {
    await authService.login({
      email,
      password,
    });
    
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
    setRole('produtor');
  };

  const signOut = () => {
    authService.logout();
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        isAuthenticated: !!user,
        signOut,
        register,
        login,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
