import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { userService, familyService } from '@/lib/firestore';
import { User, AuthState } from '@/types';

interface FirebaseAuthContextType extends AuthState {
  login: (email: string, password: string, role: 'parent' | 'child') => Promise<boolean>;
  register: (email: string, password: string, name: string, role: 'parent' | 'child') => Promise<boolean>;
  register: (email: string, password: string, name: string, role: 'parent' | 'child') => Promise<boolean>;
  logout: () => Promise<void>;
  familyId: string | null;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextType | undefined>(undefined);

export function FirebaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });
  const [familyId, setFamilyId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userData = await userService.getUser(firebaseUser.uid);
          
          if (userData) {
            setAuthState({
              user: userData,
              isLoading: false,
              isAuthenticated: true,
            });

            // Get family ID for parents
            if (userData.role === 'parent') {
              const family = await familyService.getFamilyByParent(firebaseUser.uid);
              setFamilyId(family?.id || null);
            } else {
              // For children, get family ID from their user profile
              setFamilyId(userData.familyId || null);
            }
          } else {
            // User exists in Firebase Auth but not in Firestore
            setAuthState({
              user: null,
              isLoading: false,
              isAuthenticated: false,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
        setFamilyId(null);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string, role: 'parent' | 'child'): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await userService.getUser(userCredential.user.uid);
      
      if (userData && userData.role === role) {
        return true; // Auth state will be updated by onAuthStateChanged
      } else {
        await signOut(auth);
        setAuthState(prev => ({ ...prev, isLoading: false }));
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const register = async (email: string, password: string, name: string, role: 'parent' | 'child'): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      const userData: Omit<User, 'id'> = {
        name,
        email,
        role,
        userid: userCredential.user.uid,
        user_id: userCredential.user.uid,
        avatar: role === 'parent' 
          ? null 
          : 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
      };
      
      await userService.createUser(userCredential.user.uid, userData);
      
      // Create family for parents
      if (role === 'parent') {
        const family = await familyService.createFamily({
          name: `${name}'s Family`,
          parentId: userCredential.user.uid,
          parentName: name,
          parentEmail: email,
        });
        setFamilyId(family.id);
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      setFamilyId(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <FirebaseAuthContext.Provider value={{
      ...authState,
      login,
      register,
      logout,
      familyId,
    }}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  const context = useContext(FirebaseAuthContext);
  if (context === undefined) {
    throw new Error('useFirebaseAuth must be used within a FirebaseAuthProvider');
  }
  return context;
}