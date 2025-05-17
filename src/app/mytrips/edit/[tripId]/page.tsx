'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/component/Map'), {
  ssr: false,
});




interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface Trip {
    tripName: string;
    person: Number;
    tripTime: TripTime;
    isPublic: boolean;
    tripCountry: string;
    createAt: Timestamp;
    updateAt: Timestamp;
}
export default function TripEditPage() {

    const router = useRouter();
    const [isLoading, setIsloading] = useState<boolean>(true);
    // 從useContext取得使用者的登入資料
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 取得此筆旅程資料
    const { tripId } = useParams();
    const [trip, setTrip] = useState<Trip>();

    // 使用者是否為登入狀態
    useEffect(() => {
        if (!isUserSignIn && !loading) {
            router.push("/login");
            return;
        }
    }, [isUserSignIn, loading])

    // 確認使用者有此trip，並取得此筆旅程的概覽
    useEffect(() => {

        async function fetchTrip() {

            if (!user || !tripId || typeof tripId !== 'string') {
                router.push('/not-found');
                return;
            }

            const tripRef = doc(db, "users", user.uid, "trips", tripId);
            const tripSnap = await getDoc(tripRef);
            if (!tripSnap.exists()) {
                router.push('/not-found');
                return;
            }

            const tripData = tripSnap.data() as Trip;
            if (!tripData) {
                router.push('/not-found');
                return;
            }
            setTrip(tripData);
        }
        fetchTrip();
        console.log("GOOGLE MAP KEY", process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
        setIsloading(false);
    }, [tripId]);

    if (isLoading) return <div>載入中...</div>;


    return (
        <div className='w-full h-full'>
            編輯頁
             <MapComponent />
        </div>
    )

}
