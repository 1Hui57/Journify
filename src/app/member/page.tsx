'use client'

import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { query, collection, onSnapshot, Timestamp, doc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Trip } from "../type/trip";
import { useRouter } from 'next/navigation';
import { IoIosCamera } from "react-icons/io";
import UploadMemberPhoto from "@/component/UploadMemberPhoto";
import { MdEdit } from "react-icons/md";

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

    // 上傳圖片狀態
    const [isUploadPhoto, setTsUploadPhoto] = useState<boolean>(false);

    // 自訂使用者暱稱
    const [isEditingNickName, setIsEditingNickName] = useState<boolean>(false);
    const [userNickName, setUserNickName] = useState<string | null>(null);

    // 更新暱稱狀態
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

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

    // 儲存使用者更新的暱稱
    const updateUserNickName = async (userId: string, userNickName: string) => {
        if (!userId) return;
        if (!userNickName) {
            alert("請輸入暱稱");
            return;
        }
        setSaveStatus("saving");
        try {
            await updateDoc(doc(db, "users", userId), {
                nickName: userNickName
            });
            console.log("更新成功");
            setSaveStatus("success");
            // 1.5 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1000);
        } catch (err) {
            console.error("更新失敗", err);
            setSaveStatus("error");
            // 2 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1500);
        } finally {
            setIsEditingNickName(false);
            setUserNickName(null);
        }
    }

    return (
        <div className="w-full h-full">
            {saveStatus !== "idle" && (
                <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <div className='w-fit h-fit px-5 py-3  text-mywhite-100 text-base-500'>
                        {saveStatus === "saving" && <span >儲存中...</span>}
                        {saveStatus === "success" && <span >儲存成功！</span>}
                        {saveStatus === "error" && <span >儲存失敗，請稍後再試</span>}
                    </div>
                </div>)}
            <div className="relative w-full h-60" style={{ backgroundImage: `url('/member-background.jpg')`, }}>
                <div className="absolute w-30 h-30 bottom-[-55px] left-1/2 transform -translate-x-1/2  rounded-full bg-amber-100 overflow-hidden">
                    <img src={userData?.memberPhotoUrl} className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-fit h-fit text-primary-600 bottom-[-63px] left-1/2 transform -translate-x-1/2 bg-mywhite-100 rounded-full shadow-lg cursor-pointer">
                    <IoIosCamera className="w-6 h-6" onClick={() => { setTsUploadPhoto(true) }} />
                </div>
            </div>
            <div id="userData" className="w-fit h-fit m-auto mt-18 text-myzinc-700 text-center flex flex-col gap-1">
                <div className="flex justify-center items-center">
                    {isEditingNickName ?
                        <div className="flex justify-center items-center gap-1">
                            <p className="text-md font-500 text-myzinc-500">暱稱</p>
                            <input type="text" onChange={(e) => { setUserNickName(e.target.value) }} className="border-1 border-myzinc-400" />
                            <button onClick={() => { setIsEditingNickName(false) }}
                                className="bg-myzinc-300 rounded-full px-2 py-1 hover:bg-myzinc-400 text-myblue-700 hover:text-mywhite-100 text-sm-400">取消</button>
                            <button onClick={() => { if (!userId || !userNickName) return; updateUserNickName(userId, userNickName) }}
                                className="bg-primary-300 rounded-full px-2 py-1 hover:bg-myblue-400 text-myblue-700 hover:text-primary-300 text-sm-400">儲存</button>
                        </div>
                        : <>
                            <p className="text-md font-500 text-myzinc-500">暱稱  <span className="text-myzinc-700">{userData?.nickName ? userData.nickName : "未設定"}</span></p>
                            <MdEdit onClick={() => { setIsEditingNickName(true) }} className="ml-2 cursor-pointer" />
                        </>
                    }

                </div>
                <p className="text-myzinc-500">ID <span className="text-myzinc-700">{userId}</span></p>
            </div>
            {isUploadPhoto && <UploadMemberPhoto userId={userId} setTsUploadPhoto={setTsUploadPhoto} />}
        </div>
    )
}