'use client'

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from '@/context/AuthContext';
export default function Header() {

    const pathname = usePathname();
    const router = useRouter();

    // 從useContext取得登入狀態
    const { isUserSignIn } = useAuth();


    function handleLogout() {
        signOut(auth)
            .then(() => {
                router.push("/")
                console.log("使用者已登出");
            })
            .catch((error) => {
                console.error("登出失敗：", error);
            });
    }

    return (
        <header className='p-0 m-0 h-[60px] w-full flex items-center shadow-md bg-mywhite-100 fixed top-0 left-0 z-50'>
            <div id="header" className="w-full h-full pl-4 pr-4 flex text-3xl justify-between items-center">
                <img src="/journify.png" alt="" className='w-32 h-7 cursor-pointer' onClick={() => { router.push('/') }} />
                <div className='flex justify-between gap-6'>
                    <button className='text-base-500  text-primary-900 text-center' onClick={() => { router.push('/mytrips') }}>
                        我的旅程
                    </button>
                    {isUserSignIn ?
                        <button onClick={handleLogout} className='text-base-500  text-primary-900 text-center'>
                            登出
                        </button>
                        : <button className='text-base-500  text-primary-900 text-center' onClick={() => { router.push('/login') }}>
                            登入/註冊
                        </button>}
                </div>
            </div>
        </header>
    );
}