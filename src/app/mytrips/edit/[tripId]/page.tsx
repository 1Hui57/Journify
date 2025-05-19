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
interface Country {
    countryCode: string;
    countryName: string;
    lat: number;
    lng: number;
}
export default function TripEditPage() {

    const router = useRouter();
    const [isLoading, setIsloading] = useState<boolean>(true);
    // 從useContext取得使用者的登入資料
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;
    const [countries, setCountries] = useState<Country[]>([]);
    const [countryData, setCountryData] = useState<Country>();

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
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.log("載入國家失敗ˇ"));
        async function fetchTrip() {
            if (!user || !tripId || typeof tripId !== 'string') {
                router.push('/not-found');
                return;
            }

            const tripRef = doc(db, 'users', user.uid, 'trips', tripId);
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

            // 確保 countries 已經載入，才執行
            if (countries.length > 0) {
                const matchedCountry = countries.find(
                    (item) =>  item.countryName===tripData.tripCountry
                );
                setCountryData(matchedCountry);
            }
            setIsloading(false);
        }

        fetchTrip();
    }, [tripId, user, countries]);

    if (isLoading) return <div>載入中...</div>;


    return (
        <div className='w-full h-full flex '>
            <div className='w-[30%] h-full'>每日行程編輯區</div>
            <div className='w-[70%] h-full' >
                <MapComponent countryData={countryData} />
            </div>

        </div>
    )

}
