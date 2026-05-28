import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  // keep mocks for fallback / backwards compatibility if needed during transition
  loginMock: (email: string) => Promise<void>;
  loginWithGoogleMock: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  loginMock: async () => {},
  loginWithGoogleMock: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Monitor auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper to ensure user exists in Firestore
  const ensureUserDocument = async (user: User, additionalData?: any) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        email: user.email,
        displayName: user.displayName || additionalData?.displayName || 'Student',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...additionalData
      });
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await ensureUserDocument(user, { displayName });
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const { user } = await signInWithPopup(auth, provider);
      await ensureUserDocument(user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  // Keep mocks for testing if needed
  const loginMock = async (email: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setCurrentUser({ uid: 'mock-user-123', email, displayName: 'Test Student' } as User);
    setLoading(false);
  };

  const loginWithGoogleMock = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setCurrentUser({ uid: 'mock-google-123', email: 'student@gmail.com', displayName: 'Google Student' } as User);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      loading, 
      login, 
      signup, 
      loginWithGoogle, 
      logout,
      loginMock,
      loginWithGoogleMock
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
