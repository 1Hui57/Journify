'use client'
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
import { DiVim } from 'react-icons/di';
interface TripTime {
    tripFrom: Timestamp;
    tripTo: Timestamp;
}
interface Trip {
    userId: string
    tripId: string;
    tripName: string;
    person: number;
    tripTime: TripTime;
    isPublic: boolean;
    createAt: Timestamp;
    updateAt: Timestamp;
    tripCountry: string;
}
interface HomeTripCardProps {
    item: Trip
}
export default function HomeTripCard({ item }: HomeTripCardProps) {
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
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        });
    } else {
        tripUpdateTime = "未設定";
    }

    const tripDays = Math.ceil((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24) + 1);

    return (
        <div className="relative w-full h-80 rounded-md overflow-hidden cursor-pointer">
            {item.tripCountry === "" ?
                <></>
                : <div className='absolute top-3 left-3 w-fit h-fit text-mywhite-100 flex items-end'>
                    <IoLocationOutline className='w-7 h-6 mr-1' />
                    <p className='text-base-500 line-clamp-1'>{item.tripCountry}</p>
                </div>}
            <img src="/Tokyo.jpg" className="w-full h-[70%] rounded-3xl object-cover" />
            <div className="w-full h-fit pl-2 pr-2 pt-1 flex flex-col gap-1">
                <p className="text-myblue-800 text-base-700 font-bold line-clamp-1">{item.tripName}</p>
                <div className='w-full h-fit flex justify-between'>
                    <p className="text-base-400 text-myblue-300">{`${tripDays} 天`}</p>
                    <p className="text-base-400 text-myblue-300">最後更新:{formatted}</p>
                </div>
                
                <div className="w-full h-fit flex justify-between items-center text-myblue-800">
                    <p className="text-base-400 text-myblue-300 w-fit line-clamp-1">由 匿名 建立</p>
                    <div className="relative flex-grow w-fit flex justify-end">
                        <AiOutlineHeart className='w-6 h-6 mr-1' />
                        <p>150</p>
                        <BsBookmark className='w-5 h-6 ml-2' />
                    </div>
                </div>
            </div>
        </div>
    )
}