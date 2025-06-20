'use client'

import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';

import { useUserData } from "@/context/UserDataContext";

interface User {
    email: string;
    memberPhotoUrl: string;
    createdAt: Timestamp;
    likeTrips: string[] | null;
    saveTrips: string[] | null;
    nickName: string | undefined;
}

export default function UserPage() {

    const router = useRouter();

    // 取得該使用者ID
    const params = useParams();
    const userId = typeof params.userId === "string" ? params.userId : params.userId?.[0];


    // 取得Context的user資料
    const { addUserId, userDataMap } = useUserData();


    useEffect(() => {
        if (userId) addUserId(userId);
    }, [userId]);

    const userData = userDataMap.get(userId || "");

    return (
        <div className="w-full h-full">
            <div className="relative w-full h-60" style={{ backgroundImage: `url('/member-background.jpg')`, }}>
                <div className="absolute w-30 h-30 bottom-[-55px] left-1/2 transform -translate-x-1/2  rounded-full bg-amber-100 overflow-hidden">
                    <img src={userData?.memberPhotoUrl} className="w-full h-full object-cover" />
                </div>
            </div>
            <div id="userData" className="w-fit h-fit m-auto mt-18 text-myzinc-700 text-center flex flex-col gap-1">
                <div className="flex justify-center items-center">
                    <p className="text-md font-500 text-myzinc-500">暱稱  <span className="text-myzinc-700">{userData?.nickName ? userData.nickName : "未設定"}</span></p>
                </div>
                <p className="text-myzinc-500">ID <span className="text-myzinc-700">{userId}</span></p>
            </div>
        </div>
    )
}