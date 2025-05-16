'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface Trip {
    tripName: string;
    person: Number;
    tripTime: TripTime;
    isPublic: boolean;
    tripCountry:string;
    createAt:Timestamp;
    updateAt:Timestamp;
}
export default function TripEditPage() {

    const router = useRouter();
    // 從useContext取得使用者的登入資料
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 取得此筆旅程資料
    const { tripId } = useParams();
    const [trip, setTrip] = useState(null);

    // 使用者是否為登入狀態
    useEffect(() => {
        if (!isUserSignIn && !loading) {
            router.push("/login")
        }
    }, [isUserSignIn, loading])

    // 取得此筆旅程的概覽
    useEffect(() => {

    }, [])
}