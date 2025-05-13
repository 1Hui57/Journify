'use client'
import { useEffect, useState } from 'react';
import SearchBar from "@/component/SearchBar";
import { query, collection, onSnapshot, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";

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
}
interface HomeTripCardProps {
    item: Trip
}
export default function HomeTripCard({ item }: HomeTripCardProps) {
    // 計算天數
    const tripStartDate = item.tripTime.tripFrom.toDate();
    const tripEndDate = item.tripTime.tripTo.toDate();
    const tripDays = Math.ceil((tripEndDate.getTime()- tripStartDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <div className="flex-1  min-w-[300px] h-[360px]  rounded-md overflow-hidden">
            <img src="/Tokyo.jpg" className="w-full h-[68%] rounded-md object-cover" />
            <div className="w-full pl-2 pr-2 pt-1 flex flex-col gap-1">
                <p className="text-myblue-300">{`${tripDays} 天`}</p>
                <p className="text-black text-lg font-bold">{item.tripName}</p>
                <div className="w-full h-[35px] flex justify-between items-center">
                    <p className="text-myblue-300 w-fit">小貓</p>
                    <div className="relative flex-grow w-fit flex  gap-2 justify-end">
                        <img src="/good-empty.png" className="w-5 h-5 " />
                        <p>150</p>
                        <img src="/collect-empty.png" className="w-5 h-6 ml-2" />
                    </div>
                </div>
            </div>
        </div>
    )
}