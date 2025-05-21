'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';

import dynamic from 'next/dynamic';
import EditTrip from '@/component/EditTrip';

import { FaAngleLeft } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io"; //加號


const MapComponent = dynamic(() => import('@/component/Map'), {
    ssr: false,
});
interface TripTime {
    tripFrom: Timestamp;
    tripTo: Timestamp;
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
interface TripDay {
    id: string;
    date: string;      // 格式：2025.05.12
    number: number;     // 例如：1
    isChoose: boolean;
    rawDate: Date;
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

    // 旅程的每一天跟目前選擇哪一天
    const [tripDays, setTripDays] = useState<TripDay[]>([]);

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
            setTripDays(generateTripDays(tripData.tripTime.tripFrom, tripData.tripTime.tripTo));

            // 確保 countries 已經載入，才執行
            if (countries.length > 0) {
                const matchedCountry = countries.find(
                    (item) => item.countryName === tripData.tripCountry
                );
                setCountryData(matchedCountry);
            }
            setIsloading(false);
        }

        fetchTrip();
    }, [tripId, user,countries]);

    const scrollRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' });
    };

    const formatteDate = (date: any) => {
        let realDate: Date;
        if (typeof date === 'object' && date?.seconds) {
            // Firestore Timestamp 格式（轉成毫秒）
            realDate = new Date(date.seconds * 1000);
            const year = realDate.getFullYear();
            const month = String(realDate.getMonth() + 1).padStart(2, '0');
            const day = String(realDate.getDate()).padStart(2, '0');
            return `${year}/${month}/${day}`;
        }
        else {
            return '無效日期';
        }
    };

    // 計算旅程開始日期至結束日期的每日日期
    const generateTripDays = (_start: Timestamp, _end: Timestamp): TripDay[] => {
        const days: TripDay[] = [];
        const currentDate = _start.toDate();
        const endDate = _end.toDate();
        let dayCount = 1;
        while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(currentDate.getDate()).padStart(2, '0');
            const dayId = uuidv4();
            const rawDate = new Date(currentDate);
            const isChoose = dayCount === 1 ? true : false;
            days.push({
                id: dayId,
                date: `${month}月${day}日`,
                number: dayCount,
                isChoose: isChoose,
                rawDate: rawDate
            });
            currentDate.setDate(currentDate.getDate() + 1); // 加一天
            dayCount++;
        }
        return days;
    };

    // 新增天數
    const addTripDate = () => {
        const lastDate: TripDay = tripDays[tripDays.length - 1];
        const newDate = new Date(lastDate.rawDate); // 複製日期物件
        newDate.setDate(newDate.getDate() + 1); // 加一天

        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        const newTripDay: TripDay = {
            id: uuidv4(),
            date: `${month}月${day}日`,
            number: lastDate.number + 1,
            rawDate: newDate,
            isChoose: false
        };
        setTripDays([...tripDays, newTripDay]);
    }

    const chooseDate = (id: string) => {
        setTripDays(tripDays.map((item) => {
            return {
                ...item,
                isChoose: item.id === id // 如果是選中的就 true，其他就 false
            };
        }));
    }





    if (isLoading) return <div>載入中...</div>;


    return (
        <div className='w-full h-full flex flex-col-reverse md:flex-row'>
            <div className='h-72 md:w-[350px] flex-none md:h-full'>
                <div className='w-full h-full bg-mywhite-100'>
                    <div className='w-full h-16 px-5 text-myzinc-800 flex items-center justify-between'>
                        <div className='w-fit text-2xl-700'>{trip?.tripName}</div>
                        {trip && <div className='w-fit text-base-400'>{formatteDate(trip?.tripTime.tripFrom)}~{formatteDate(trip?.tripTime.tripTo)}</div>}
                    </div>
                    <div className='w-full h-14 border-myzinc-200 border-1 flex items-center' >
                        <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollLeft}><FaAngleLeft /></div>
                        <div className='w-full h-full flex overflow-hidden' id="dateChoose" ref={scrollRef}>
                            {tripDays.map((item: TripDay) => {
                                return (
                                    <div key={item.id}
                                        onClick={()=>chooseDate(item.id)}
                                        className={item.isChoose === true ?
                                            'w-30 flex-shrink-0 text-sm-700 text-center border-b-5 border-primary-600 cursor-pointer '
                                            : 'w-30 flex-shrink-0 text-sm-400 text-center border-x-1 border-myzinc-200 cursor-pointer'}
                                    >
                                        <p>{item.date}</p>
                                        <p>第{item.number}天</p>
                                    </div>
                                )
                            })}
                            <div onClick={() => addTripDate()} className='w-26 flex flex-col flex-shrink-0 text-sm-700 text-myzinc-600 text-center border-x-1 border-myzinc-200 items-center cursor-pointer'>
                                <IoMdAdd className='w-6 h-8 m-auto' />
                                <p >新增天數</p>
                            </div>
                        </div>
                        <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollRight}><FaAngleRight /></div>
                    </div>
                </div>
            </div>
            <div className='w-full h-full flex-1' >
                <MapComponent countryData={countryData} />
            </div>
        </div>
    )

}
