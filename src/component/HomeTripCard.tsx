'use client'
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import SearchBar from "@/component/SearchBar";
import { query, collection, onSnapshot, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { AiFillLike } from "react-icons/ai"; //實心讚
import { AiOutlineLike } from "react-icons/ai"; //線條讚
import { AiOutlineHeart } from "react-icons/ai"; //線條愛心
import { AiFillHeart } from "react-icons/ai"; //實心愛心
import { BsBookmark } from "react-icons/bs"; //線條儲存
import { BsBookmarkFill } from "react-icons/bs"; //實心儲存
import { IoLocationOutline } from "react-icons/io5"; //地圖標示
import { PublicTrip } from '@/app/type/trip';
import { useUserData } from '@/context/UserDataContext';


interface HomeTripCardProps {
    item: PublicTrip;
    likeTrips: string[];
    saveTrips: string[];
    isUserSignIn: boolean;
    toggleLike: (tripId: string) => void;
    toggleSave: (tripId: string) => void;
    showLoginAlert: () => void;
}

export default function HomeTripCard({ item, likeTrips, saveTrips, isUserSignIn, toggleLike, toggleSave, showLoginAlert }: HomeTripCardProps) {

    const router = useRouter();

    // 愛心與收藏狀態
    const [isLike, setIsLike] = useState<boolean>(false);
    const [isSave, setIsSave] = useState<boolean>(false);
    const [likeCount, setLikeCount] = useState<number>(0);

    // 取得Context的user資料
    const { addUserId, userDataMap } = useUserData();

    const nickname = userDataMap.get(item.userId)?.nickName || '匿名';
    const userNameStyle = item.userId === "XGcaaXqyE9caqaGf6lD4Er5nwdN2" ?'text-primary-500 cursor-pointer font-500':'text-myblue-600 cursor-pointer font-500'

        useEffect(() => {
            if (!item) return;
            setLikeCount(item.likeCount);
        }, [item])

    useEffect(() => {
            if (likeTrips.length === 0) {
                setIsLike(false);
                return;
            }
            const isLiked = likeTrips.includes(item.tripId);
            setIsLike(isLiked);
        }, [likeTrips])

    useEffect(() => {
        if (saveTrips.length === 0) {
            setIsSave(false);
            return;
        }
        const isSave = saveTrips.includes(item.tripId);
        setIsSave(isSave);
    }, [saveTrips])

    // 計算天數
    const tripStartDate = item.tripTime.tripFrom.toDate();
    const tripEndDate = item.tripTime.tripTo.toDate();
    let tripUpdateTime;
    let formatted;
    if (item.updateAt && item.updateAt !== undefined) {
        tripUpdateTime = item.updateAt.toDate();
        formatted = tripUpdateTime.toLocaleString("zh-TW", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour12: false
        });
    } else {
        tripUpdateTime = "未設定";
    }

    const tripDays = Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1);

    const toggleLikeCount = () => {
        setLikeCount(isLike ? likeCount - 1 : likeCount + 1)
    }

    // 點擊愛心 icon 時
    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止跳轉到詳細頁

        if (!isUserSignIn) {
            showLoginAlert();
            return;
        }

        toggleLike(item.tripId);
        toggleLikeCount();
    };

    // 點擊收藏 icon 時
    const handleSaveClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // 防止跳轉到詳細頁

        if (!isUserSignIn) {
            showLoginAlert();
            return;
        }

        toggleSave(item.tripId);
    };

    return (
        <div
            className="relative w-full h-80 rounded-md overflow-hidden">
            <div className='absolute top-3 left-3 w-fit h-fit text-mywhite-100 flex items-end'>
                <IoLocationOutline className='w-7 h-6 mr-1' />
                {Array.isArray(item.tripCountry) &&
                    item.tripCountry.map((country, index) => (
                        <div key={index} className='mr-2'><p className='text-base-500'>{country.countryName}</p></div>

                    ))}
            </div>
            <img src={item.tripPhotoUrl ? `${item.tripPhotoUrl}` : "/Tokyo.jpg"}
                onClick={() => { router.push(`/sharing/${item.tripId}`) }}
                className="w-full h-[70%] rounded-xl object-cover cursor-pointer" />
            <div className="w-full h-fit pl-2 pr-2 pt-1 flex flex-col gap-1">
                <p onClick={() => { router.push(`/sharing/${item.tripId}`) }}
                    className="text-myblue-800 text-base-700 line-clamp-1 cursor-pointer">{item.tripName}</p>
                <div className='w-full h-fit flex justify-between'>
                    <p className="text-base-400 text-myblue-300">{`${tripDays} 天`}</p>
                    <p className="text-base-400 text-myblue-300">更新：{formatted}</p>
                </div>

                <div className="w-full h-fit flex justify-between items-center text-myblue-600 gap-1">
                    <p className="text-base-400 text-myblue-300 w-fit line-clamp-1">由
                        <span onClick={(e) => { e.stopPropagation(); router.push(`/User/${item.userId}`) }} className={userNameStyle}>{nickname}</span>
                        建立
                    </p>
                    <div className="relative flex-grow w-fit flex justify-end">
                        {isLike ?
                            <AiFillHeart className='w-6 h-6 mr-1 cursor-pointer' onClick={handleLikeClick} />
                            : <AiOutlineHeart className='w-6 h-6 mr-1 cursor-pointer' onClick={handleLikeClick} />}

                        <p>{likeCount}</p>
                        {isSave ?
                            <BsBookmarkFill className='w-5 h-6 ml-2 cursor-pointer' onClick={handleSaveClick} />
                            : <BsBookmark className='w-5 h-6 ml-2 cursor-pointer' onClick={handleSaveClick} />
                        }

                    </div>
                </div>
            </div>
        </div>
    )
}