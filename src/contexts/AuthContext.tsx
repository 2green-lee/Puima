import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

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
    // Initial fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Sync user profile to Supabase
      const fetchOrUpdateUser = async () => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

          let adminStatus = false;
          if (error && error.code === 'PGRST116') {
            // Document doesn't exist
            adminStatus = user.email === 'rtytgb123@gmail.com' || user.email === 'lgi12@naver.com';
            console.log("AuthContext: Creating new user doc, adminStatus:", adminStatus);
            
            const newUser = {
              id: user.id,
              email: user.email,
              displayName: user.user_metadata?.full_name || user.email?.split('@')[0],
              photoURL: user.user_metadata?.avatar_url,
              isAdmin: adminStatus,
            };

            const { error: insertError } = await supabase.from('users').insert(newUser);
            if (!insertError) {
              setUserProfile(newUser);
            } else {
               console.error("AuthContext: Error creating user doc:", insertError);
            }
          } else if (data) {
            adminStatus = data.isAdmin || user.email === 'rtytgb123@gmail.com' || user.email === 'lgi12@naver.com';
            setUserProfile(data);
          } else if (error) {
            console.error("AuthContext: Error fetching user doc:", error);
            adminStatus = user.email === 'rtytgb123@gmail.com' || user.email === 'lgi12@naver.com';
          }
          setIsAdmin(adminStatus);
        } catch (err) {
          console.error("AuthContext: Global error in user fetching:", err);
          setIsAdmin(user.email === 'rtytgb123@gmail.com' || user.email === 'lgi12@naver.com');
        }
      };

      fetchOrUpdateUser();

      // Listen for profile changes
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
          (payload) => {
            if (payload.new) setUserProfile(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setIsAdmin(false);
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
