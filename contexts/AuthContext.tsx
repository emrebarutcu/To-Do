import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role: 'parent' | 'child') => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  {
    id: 'parent-1',
    name: 'Sarah Johnson',
    email: 'parent@family.com',
    role: 'parent',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'child-1',
    name: 'Emma',
    email: 'emma@family.com',
    role: 'child',
    childId: '1',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'child-2',
    name: 'Liam',
    email: 'liam@family.com',
    role: 'child',
    childId: '2',
    avatar: 'https://images.pexels.com/photos/1674752/pexels-photo-1674752.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'child-3',
    name: 'Sophie',
    email: 'sophie@family.com',
    role: 'child',
    childId: '3',
    avatar: 'https://images.pexels.com/photos/1462630/pexels-photo-1462630.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // Simulate checking for existing session
    const timer = setTimeout(() => {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const login = async (email: string, password: string, role: 'parent' | 'child'): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = mockUsers.find(u => u.email === email && u.role === role);
    
    if (user) {
      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });
      return true;
    }

    setAuthState(prev => ({ ...prev, isLoading: false }));
    return false;
  };

  const logout = () => {
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}