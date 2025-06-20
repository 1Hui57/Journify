'use client'

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from "react";
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from "firebase/auth";
import { useAuth } from '@/context/AuthContext';
import { useUserData } from '@/context/UserDataContext';
import { TbLogout } from "react-icons/tb";
import { FaCircleUser } from "react-icons/fa6";

export default function Header() {

    const pathname = usePathname();
    const router = useRouter();

    // 從useContext取得登入狀態
    const { isUserSignIn } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 取得Context的user資料
    const { addUserId, userDataMap } = useUserData();

    // 顯示會員按鈕
    const [showMemberList, setShowMemberList] = useState<boolean>(false);
    const memberMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userId) addUserId(userId);
    }, [userId]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (memberMenuRef.current && !memberMenuRef.current.contains(event.target as Node)) {
                setShowMemberList(false);
            }
        }

        if (showMemberList) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMemberList]);

    const userData = userDataMap.get(userId || "");

    function handleLogout() {
        signOut(auth)
            .then(() => {
                const isStayPage =
                    pathname === "/" ||
                    pathname.startsWith("/sharing/") ||
                    pathname.startsWith("/Country/");
                setShowMemberList(false);

                if (!isStayPage) {
                    router.push("/");
                    setShowMemberList(false);
                }
                console.log("使用者已登出");
            })
            .catch((error) => {
                console.error("登出失敗：", error);
            });
    }

    function toggleShowMemberList() {
        setShowMemberList(!showMemberList);
    }



    return (
        <header className='p-0 m-0 h-[60px] w-full flex items-center shadow-md bg-mywhite-100 fixed top-0 left-0 z-500'>
            <div id="header" className="w-full h-full pl-4 pr-4 flex text-3xl justify-between items-center">
                <img id="logo" src="/JOURNIFY.png" alt="" className='w-32 h-7 cursor-pointer' onClick={() => { router.push('/') }} />
                <div className='flex justify-between gap-6'>
                    <button className='text-base-500  text-primary-900 text-center hover:text-primary-600' onClick={() => { router.push('/mytrips') }}>
                        我的旅程
                    </button>
                    {isUserSignIn ?
                        <div className='relative' ref={memberMenuRef}>
                            <div className='w-6 h-6 rounded-full overflow-hidden cursor-pointer'>
                                <img src={userData?.memberPhotoUrl} onClick={() => { toggleShowMemberList() }} className='w-full h-full'></img>
                            </div>
                            {showMemberList &&
                                <div className='absolute top-10 right-0 w-30 h-fit bg-mywhite-100 flex flex-col p-2 gap-2 rounded-md shadow-lg'>
                                    <button onClick={() => { router.push("/member"); setShowMemberList(false); }} className='flex h-fit p-1 items-center gap-2 text-base-500 text-primary-900 text-center hover:text-primary-600'>
                                        <FaCircleUser className='w-6 h-6' />
                                        <p className='text-sm-700'>我的帳戶</p>
                                    </button>
                                    <button onClick={handleLogout} className='flex h-fit p-1 items-center gap-2 text-base-500 text-primary-900 text-center hover:text-primary-600'>
                                        <div className='w-fit h-fit '>
                                            <TbLogout className='w-6 h-6' />
                                        </div>
                                        <p className='text-sm-700'>登出</p>
                                    </button>
                                </div>
                            }

                        </div>
                        : <button className='text-base-500  text-primary-900 text-center hover:text-primary-600' onClick={() => { router.push('/login') }}>
                            登入/註冊
                        </button>}
                </div>
            </div>
        </header>
    );
}