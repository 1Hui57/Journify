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
                <div id="header" className=" pl-4 pr-4 flex text-3xl    justify-between">
                    <div className='flex'>
                        <img src="/JOURNIFY.png" alt="" className='w-47 h-20' />
                    </div>
                    <div className='flex justify-between gap-6'>
                        <button className='text-lg font-bold text-primary-900 text-center'>
                            開始規劃
                        </button>
                        <button className='text-lg font-bold text-primary-900 text-center'>
                            登入/註冊
                        </button>
                    </div>

                </div>
            </nav>
        </header>
    );
}