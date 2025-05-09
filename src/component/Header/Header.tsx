'use client'
import styles from './Header.module.css';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from "react";
// import { signOut } from 'firebase/auth';
// import { auth } from '@/lib/firebase';

export default function Header() {

    const pathname = usePathname();
    const router = useRouter();

    // const [showLogout, setShowLogout] = useState(false);
    // useEffect(() => {
    //     // 只有在 /accounting 顯示登出按鈕
    //     setShowLogout(pathname.startsWith('/accounting'));
    // }, [pathname]);

    // function handleLogout() {
    //     signOut(auth)
    //         .then(() => {
    //             console.log("使用者已登出");
    //             router.push('/');
    //         })
    //         .catch((error) => {
    //             console.error("登出失敗：", error);
    //         });
    // }

    return (
        <header>
            <nav>
                <div id="header" className=" p-6 flex text-3xl text-primary-900 font-black text-center justify-between">
                    <div className='flex'>
                        <img src="/journify-logo.png" alt="" className='w-8 h-8' />
                        OURNIFY
                    </div>
                    <button className='text-base'>
                        登入 / 註冊
                    </button>
                </div>
            </nav>
        </header>
    );
}