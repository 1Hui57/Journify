'use client'
import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

// 型別定義（可根據需要擴充）
interface AuthContextType {
  isUserSignIn: boolean;
  loading: boolean;
}
//建立useContext物件
const AuthContext = createContext<AuthContextType>({
  isUserSignIn: false,
  loading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isUserSignIn, setIsUserSignIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsUserSignIn(!!user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ isUserSignIn, loading  }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自訂 Hook（方便在其他地方呼叫）
export const useAuth = () => useContext(AuthContext);