'use client'

import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { query, collection, onSnapshot, Timestamp, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Trip } from "../type/trip";
import { useRouter } from 'next/navigation';

interface User {
    email: string;
    memberPhotoUrl: string;
    createdAt: Timestamp;
    likeTrips: string[] | null;
    saveTrips: string[] | null;
    nickName: string | undefined;
}

export default function MemberPage() {

    const router = useRouter();

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 使用者資料
    const [userData, setUserData] = useState<User | null>(null);

    // 取得使用者資料庫的資料
    useEffect(() => {
        if (!user) {
            // router.push("/");
            return;
        }

        const userDocRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as User;
                setUserData(data);
            } else {
                console.log("找不到使用者資料");
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    return (
        <div className="w-full h-full">
            <div className="relative w-full h-60" style={{ backgroundImage: `url('/member-background.jpg')`, }}>
                <div className="absolute w-30 h-30 bottom-[-55px] left-1/2 transform -translate-x-1/2  rounded-full bg-amber-100 overflow-hidden">
                    <img src={userData?.memberPhotoUrl} alt="" />
                </div>
            </div>
            <div id="userData" className="w-fit h-fit m-auto mt-16 text-myzinc-700 text-center flex flex-col gap-1">
                <p className="text-lg font-500 text-myzinc-500">暱稱  <span className="text-myzinc-700">{userData?.nickName ? userData.nickName : "未設定"}</span></p>
                <p className="text-myzinc-500">ID <span className="text-myzinc-700">{userId}</span></p>

            </div>
        </div>
    )
}