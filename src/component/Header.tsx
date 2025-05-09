'use client'
import styles from './Header.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function Header() {

    const pathname = usePathname();
    const router = useRouter();

    const [showLogout, setShowLogout] = useState(false);
    useEffect(() => {
        // 只有在 /accounting 顯示登出按鈕
        setShowLogout(pathname.startsWith('/accounting'));
    }, [pathname]);

    function handleLogout() {
        signOut(auth)
            .then(() => {
                console.log("使用者已登出");
                router.push('/');
            })
            .catch((error) => {
                console.error("登出失敗：", error);
            });
    }

    return (
        <header className='p-0 m-0 h-[60px] w-full flex items-center shadow-md bg-mywhite-100 fixed top-0 left-0 z-50'>
            <div id="header" className="w-full h-full pl-4 pr-4 flex text-3xl justify-between items-center">
                <img src="/JOURNIFY.png" alt="" className='w-47 h-10 cursor-pointer' onClick={()=>{router.push('/')}}/>
                <div className='flex justify-between gap-6'>
                    <button className='text-lg font-bold text-primary-900 text-center' onClick={()=>{router.push('/trip')}}>
                        開始規劃
                    </button>
                    <button className='text-lg font-bold text-primary-900 text-center' onClick={()=>{router.push('/login')}}>
                        登入/註冊
                    </button>
                </div>
            </div>
        </header>
    );
}