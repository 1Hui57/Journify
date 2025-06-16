'use client'
import { PublicTrip, SelectTripDay, Trip, TripDaySchedule } from '@/app/type/trip';
import SharingAttractionWrappwer from '@/component/sharingPageComponent/SharingAttractionWrapper';
import TripAttractionWrappwer from '@/component/TripAttractionWrapper';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { SetStateAction, useEffect, useRef, useState } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';

export default function SharingTripPage() {

    const router = useRouter();
    const [isLoading, setIsloading] = useState<boolean>(true);
    // 取得此筆旅程資料
    const params = useParams();
    const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
    const [trip, setTrip] = useState<Trip>();
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    // 讀取公開的旅程並渲染
    useEffect(() => {

        if (!tripId) return;

        const fetchPublic = async () => {
            const publicTripRef = doc(db, "all_trips", tripId);
            const publicSnap = await getDoc(publicTripRef);
            if (!publicSnap.exists()) {
                router.push("/not-found");
                return;
            }
            const publicData = publicSnap.data() as PublicTrip;
            if (!publicData.userId) {
                router.push("/not-found");
                return;
            }
            setUserId(publicData.userId);
        }
        fetchPublic();
    }, [tripId]);

    // 取得 trip 資料（前提是 user 與 tripId 存在）
    useEffect(() => {
        if (!userId || !tripId || typeof tripId !== "string") return;

        const fetchTrip = async () => {
            const tripRef = doc(db, "users", userId, "trips", tripId);
            const tripSnap = await getDoc(tripRef);

            if (!tripSnap.exists()) {
                router.push("/not-found");
                return;
            }

            const tripData = tripSnap.data() as Trip;
            setTrip(tripData);
        };

        fetchTrip();
        setIsloading(false);
    }, [tripId, userId]);

    // 載入旅程資料後呈現第一天的排程
    useEffect(() => {
        if (!trip) return;
        if(trip.tripDaySchedule && trip.tripDaySchedule.length>0){
            setSelectedDay(trip.tripDaySchedule[0].id);
        }
    }, [trip])

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

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' });
    };

    function dateTimeToTimestamp(date: Date, time: string): Timestamp {
        const hours = parseInt(time.slice(0, 2), 10);
        const minutes = parseInt(time.slice(2), 10);
        const combined = new Date(date); // clone 避免改原本 date
        combined.setHours(hours);
        combined.setMinutes(minutes);
        combined.setSeconds(0);
        combined.setMilliseconds(0);
        return Timestamp.fromDate(combined); // ✅ timestamp (毫秒)
    }

    function timestampToDateTime(ts: Timestamp) {
        const date = ts.toDate();
        const time = date.toTimeString().slice(0, 5);
        return { date, time };
    }



    return (
        <div className='w-full h-full'>
            {isLoading &&
                <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <p className="text-mywhite-100">旅雀加載中...請稍後</p>
                </div>
            }
            <div className='w-full h-full bg-mywhite-100 flex flex-col'>
                <div className='w-full h-12 md:h-16 px-5 text-myzinc-800 flex items-center justify-between shadow-[0_0_8px_rgba(0,0,0,0.1)]'>
                    <div className='w-fit text-lg-700 md:text-2xl-700 line-clamp-1'>{trip?.tripName}</div>
                    {trip && <div className='w-fit text-base-400'>{formatteDate(trip?.tripTime.tripFrom)}~{formatteDate(trip?.tripTime.tripTo)}</div>}
                </div>
                <div className='w-full h-14 border-myzinc-200 border-1 flex items-center' >
                    <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollLeft}><FaAngleLeft /></div>
                    <div className='w-full h-full flex overflow-x-auto scroll-smooth no-scrollbar' id="dateChoose" ref={scrollRef}>
                        {trip && trip.tripDaySchedule && trip.tripDaySchedule.map((item: TripDaySchedule) => {
                            return (
                                <div key={item.id}
                                    onClick={() => setSelectedDay(item.id)}
                                    className={item.id === selectedDay ?
                                        'w-30 flex-shrink-0 text-sm-700 text-center border-b-5 border-primary-600 cursor-pointer '
                                        : 'w-30 flex-shrink-0 text-sm-400 text-center border-x-1 border-myzinc-200 cursor-pointer'}
                                >
                                    <p>{item.date}</p>
                                    <p>第{item.number}天</p>
                                </div>
                            )
                        })}
                    </div>
                    <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollRight}><FaAngleRight /></div>
                </div>
                <div id='dayContent' className='w-full flex-1 overflow-y-scroll pb-12'>
                    {trip && selectedDay && trip.tripDaySchedule && trip.tripDaySchedule
                        .filter(item => item.id === selectedDay)
                        .map(item => (
                            <SharingAttractionWrappwer key={item.id} tripDaySchedule={item} timestampToDateTime={timestampToDateTime} 
                             />
                        ))}
                </div>
            </div>
        </div>

    )
}