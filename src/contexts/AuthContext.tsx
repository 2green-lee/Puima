import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);
        
        if (firebaseUser) {
          console.log("AuthContext: User logged in:", firebaseUser.email);
          // Sync user profile to Firestore
          const userRef = doc(db, 'users', firebaseUser.uid);
          
          let adminStatus = false;
          try {
            const userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
              adminStatus = firebaseUser.email === 'rtytgb123@gmail.com';
              console.log("AuthContext: Creating new user doc, adminStatus:", adminStatus);
              await setDoc(userRef, {
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                photoURL: firebaseUser.photoURL,
                isAdmin: adminStatus,
                createdAt: serverTimestamp(),
              });
            } else {
              adminStatus = userDoc.data()?.isAdmin || firebaseUser.email === 'rtytgb123@gmail.com';
              console.log("AuthContext: Existing user doc, isAdmin from doc:", userDoc.data()?.isAdmin, "hardcoded check:", firebaseUser.email === 'rtytgb123@gmail.com');
            }
          } catch (docErr) {
            console.error("AuthContext: Error fetching/setting user doc:", docErr);
            // Fallback to email check even if doc fetch fails
            adminStatus = firebaseUser.email === 'rtytgb123@gmail.com';
          }
          setIsAdmin(adminStatus);
        } else {
          console.log("AuthContext: No firebase user");
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("AuthContext: Global error in onAuthStateChanged:", err);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
