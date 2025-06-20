// context/UserDataContext.tsx
'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface User {
  email: string;
  memberPhotoUrl: string;
  createdAt: any;
  likeTrips: string[] | null;
  saveTrips: string[] | null;
  nickName: string | undefined;
}

interface UserDataContextType {
  userIdSet: Set<string>;
  userDataMap: Map<string, User>;
  addUserId: (userId: string) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider = ({ children }: { children: React.ReactNode }) => {
  const [userIdSet, setUserIdSet] = useState<Set<string>>(new Set());
  const [userDataMap, setUserDataMap] = useState<Map<string, User>>(new Map());

  const addUserId = async (userId: string) => {
    if (userIdSet.has(userId) || userDataMap.has(userId)) return;

    setUserIdSet((prev) => new Set(prev).add(userId));

    // 只 fetch 沒有的 user 資料
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      setUserDataMap((prev) => new Map(prev).set(userId, userData));
    }
  };

  return (
    <UserDataContext.Provider value={{ userIdSet, userDataMap, addUserId }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) throw new Error('useUserData 必須包在 UserDataProvider 裡');
  return context;
};