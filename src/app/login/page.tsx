'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Login() {

    const router = useRouter();
    
    useEffect(() => {
        // 建立一個監聽器可以監聽firebase的登入狀態
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log(user);
                router.push('/mytrips');
            }

        });
        //  return 一個清除函數
        return () => unsubscribe();
    }, [router])


    // 註冊、登入使用useSate
    const [isSignIn, setIsSignin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isStayIn, setIsStayIn] = useState(true);

    function changeSignIn() {
        setIsSignin(true);
        setError("");
    }

    function changeSignUp() {
        setIsSignin(false);
        setError("");
    }

    // 登入
    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await setPersistence(auth, isStayIn ? browserLocalPersistence : browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            router.back();
        } catch (err: any) {
            // console.log("錯誤訊息",err.message);
            setError("帳號或密碼輸入錯誤");
        }
    };

    // 註冊
    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('密碼與確認密碼不一致');
            return;
        }
        try {
            await setPersistence(auth, isStayIn ? browserLocalPersistence : browserSessionPersistence);
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            // 創建使用者的資料表到firestore，以Auth生成的user.uid當作資料表名稱
            const user = userCredential.user;
            await setDoc(doc(db, "users", user.uid), {
                email: user.email,
                createdAt: serverTimestamp(),
            });
            router.back();
        } catch (err: any) {
            if (err.message === "Firebase: Password should be at least 6 characters (auth/weak-password).") {
                setError("密碼需大於6個字元");
            }
            else if (err.message === "Firebase: Error (auth/email-already-in-use).") {
                setError("此帳號已被註冊");
            }
            else if (err.message === "Firebase: Error (auth/invalid-email).") {
                setError("請輸入正確的E-mail格式");
            }
        }
    };


    return (
        <div className='flex-1 relative w-full h-full bg-[url("/beach.jpg")] bg-cover bg-center pt-20'>
            <div className="relative  w-[330px]  bg-mywhite-60 shadow-lg rounded-xl p-6 m-auto">
                {/* 選擇登入 / 註冊 */}
                <div className="flex justify-center gap-5 mb-6">
                    <button onClick={changeSignIn} className={`w-fit h-fit ${isSignIn ? 'text-primary-500 font-black border-b-3 border-myblue-400' : 'text-zinc-500'}`}>
                        SIGN IN
                    </button>
                    <button onClick={changeSignUp} className={`w-fit h-fit ${isSignIn ? 'text-zinc-500' : 'text-primary-500 font-black border-b-3 border-myblue-400'}`}>
                        SIGN UP
                    </button>
                </div>

                {/* 表單 */}
                {isSignIn ? (
                    <form className="flex flex-col gap-4" onSubmit={handleSignIn}>
                        <input type="text" placeholder="E-mail" value={email}
                            onChange={(e) => setEmail(e.target.value)} className=" p-2 pl-4 rounded-full w-full bg-mywhite-80" />
                        <input type="password" placeholder="Password" value={password}
                            onChange={(e) => setPassword(e.target.value)} className=" p-2 pl-4 rounded-full w-full bg-mywhite-80" />
                        <label className="flex items-center gap-2 text-sm pl-3 text-myblue-600">
                            <input type="checkbox" id="stayIn" checked={isStayIn} onChange={(e) => { setIsStayIn(e.target.checked) }} />
                            Stay signed in.
                        </label>
                        <button type="submit" className="w-[150px] bg-primary-300 text-myblue-600 font-extrabold px-4 py-2 rounded-full mx-auto">SIGN IN</button>
                    </form>
                ) : (
                    <form className="flex flex-col gap-4" onSubmit={handleSignUp}>
                        <input type="text" placeholder="E-mail" value={email}
                            onChange={(e) => setEmail(e.target.value)} className=" p-2 pl-4 rounded-full w-full bg-mywhite-80" />
                        <input type="password" placeholder="Password" value={password}
                            onChange={(e) => setPassword(e.target.value)} className=" p-2 pl-4 rounded-full w-full bg-mywhite-80" />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)} className=" p-2 pl-4 rounded-full w-full bg-mywhite-80" />
                        <label className="flex items-center gap-2 text-sm pl-3 text-myblue-600">
                            <input type="checkbox" id="stayIn" checked={isStayIn} onChange={(e) => { setIsStayIn(e.target.checked) }} />
                            Stay signed in after successful registration.
                        </label>
                        <button type="submit" className="w-[150px] bg-primary-300 text-myblue-600 font-extrabold px-4 py-2 rounded-full mx-auto">SIGN UP</button>
                    </form>
                )}

                {/* 錯誤訊息 */}
                {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
            </div>

        </div>

    )
}