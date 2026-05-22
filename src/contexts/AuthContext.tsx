import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChanged, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  userProfile: any;
  setUserProfile: React.Dispatch<React.SetStateAction<any>>;
  lang: "KOR" | "ENG";
  setLang: (lang: "KOR" | "ENG") => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (isOpen: boolean) => void;
  activeLearningClass: any;
  setActiveLearningClass: (cls: any) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  userProfile: null,
  setUserProfile: () => {},
  lang: "KOR",
  setLang: () => {},
  isProfileOpen: false,
  setIsProfileOpen: () => {},
  activeLearningClass: null,
  setActiveLearningClass: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [lang, setLang] = useState<"KOR" | "ENG">("KOR");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeLearningClass, setActiveLearningClass] = useState<any>(null);

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

  useEffect(() => {
    if (user) {
      const userRef = doc(db, "users", user.uid);
      const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data());
        }
      }, (error) => {
        console.error("Error fetching user profile:", error);
      });
      return () => unsubscribeProfile();
    } else {
      setUserProfile(null);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin,
      userProfile,
      setUserProfile,
      lang,
      setLang,
      isProfileOpen,
      setIsProfileOpen,
      activeLearningClass,
      setActiveLearningClass
    }}>
      {children}
    </AuthContext.Provider>
  );
};
