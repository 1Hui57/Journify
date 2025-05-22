'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import TripAttractionItem from "@/component/TripAttractionItem";
import { FaAngleLeft } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io"; //加號
import { Country, SelectTripDay, Trip, TripDaySchedule, TripScheduleItem } from '@/app/type/trip';
import TimeComponent from '@/component/TimeComponent';

const MapComponent = dynamic(() => import('@/component/Map'), {
    ssr: false,
});

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
    const [tripDaySchedule, setTripDaySchedule] = useState<TripDaySchedule[]>([]);
    const [selectedDay, setSelectedDay] = useState<SelectTripDay>({ id: "", date: null });

    // map 資料
    const [selectedPlace, setSelectedPlace] = useState<any>(null);

    // 顯示timePop
    const [showTimePop, setShowTimePop] = useState<boolean>(false);

    // 準備加入的景點資料 & 時間
    const [pendingPlace, setPendingPlace] = useState<TripScheduleItem | null>(null);


    // 使用者是否為登入狀態
    useEffect(() => {
        if (!isUserSignIn && !loading) {
            router.push("/login");
            return;
        }
    }, [isUserSignIn, loading])

    // 載入國家資料
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error("載入國家失敗", error));
    }, []);

    // 取得 trip 資料（前提是 user 與 tripId 存在）
    useEffect(() => {
        if (!user || !tripId || typeof tripId !== "string") return;

        const fetchTrip = async () => {
            const tripRef = doc(db, "users", user.uid, "trips", tripId);
            const tripSnap = await getDoc(tripRef);

            if (!tripSnap.exists()) {
                router.push("/not-found");
                return;
            }

            const tripData = tripSnap.data() as Trip;
            setTrip(tripData);

        };

        fetchTrip();
    }, [tripId, user]);

    // 轉換旅程天數
    useEffect(() => {
        if (!trip) return;
        const days = generateTripDays(trip.tripTime.tripFrom, trip.tripTime.tripTo);
        setTripDaySchedule([...days]);
        // 預設選擇第一天
        if (days.length > 0 && selectedDay.id === "") {
            setSelectedDay({ id: days[0].id, date: days[0].rawDate });
        }
    }, [trip])

    // countries 與 trip 都準備好後，才找對應國家
    useEffect(() => {
        if (!trip || countries.length === 0) return;

        const matchedCountry = countries.find(
            (item) => item.countryName === trip.tripCountry
        );

        setCountryData(matchedCountry);
    }, [trip, countries]);

    // 當三樣關鍵資料都存在後才解除 loading
    useEffect(() => {
        if (trip && tripDaySchedule.length > 0 && countries.length > 0 && countryData) {
            setIsloading(false);
        }
    }, [trip, tripDaySchedule, countries, countryData]);

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
    const generateTripDays = (_start: Timestamp, _end: Timestamp): TripDaySchedule[] => {
        const days: TripDaySchedule[] = tripDaySchedule;
        const currentDate = _start.toDate();
        const endDate = _end.toDate();
        let dayCount = 1;
        while (currentDate <= endDate) {
            const exists = tripDaySchedule.find((item) => {
                return item.rawDate.getMonth() === currentDate.getMonth()
                    && item.rawDate.getDate() === currentDate.getDate()
            })
            if (!exists) {
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dayId = uuidv4();
                const rawDate = new Date(currentDate);
                days.push({
                    id: dayId,
                    date: `${month}月${day}日`,
                    number: dayCount,
                    rawDate: rawDate,
                    data: []
                });
            }
            currentDate.setDate(currentDate.getDate() + 1); // 加一天
            dayCount++;
        }
        return days;
    };

    // 新增天數
    const addTripDate = () => {
        if (!trip) return
        const originEndDate = trip.tripTime.tripTo.toDate()
        // 加一天
        const nextDay = new Date(originEndDate.setDate(originEndDate.getDate() + 1));
        setTrip({
            ...trip, tripTime: {
                tripFrom: trip.tripTime.tripFrom,
                tripTo: Timestamp.fromDate(nextDay)
            }
        })
    };

    const selectDate = (id: string, date: Date) => {
        setSelectedDay({ id: id, date: date });
    }

    // 新增景點
    const addAttractionToDate = (dayId: string, tripScheduleItem: TripScheduleItem) => {
        setTripDaySchedule((prevSchedule) =>
            prevSchedule.map((item) => {
                if (item.id === dayId) {
                    return {
                        ...item,
                        data: [...item.data, tripScheduleItem],
                    };
                }
                return item; // 其他日期保持不變
            })
        );
    }

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





    if (isLoading) return <div>載入中...</div>;


    return (
        <div className='w-full h-full flex flex-col-reverse md:flex-row'>
            {showTimePop && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <TimeComponent addAttractionToDate={addAttractionToDate} selectedDay={selectedDay} pendingPlace={pendingPlace}
                    setShowTimePop={setShowTimePop} setPendingPlace={setPendingPlace} dateTimeToTimestamp={dateTimeToTimestamp} />
            </div>}
            <div className='h-72 md:w-[350px] flex-none md:h-full'>
                <div className='w-full h-full bg-mywhite-100 flex flex-col'>
                    <div className='w-full h-16 px-5 text-myzinc-800 flex items-center justify-between'>
                        <div className='w-fit text-2xl-700'>{trip?.tripName}</div>
                        {trip && <div className='w-fit text-base-400'>{formatteDate(trip?.tripTime.tripFrom)}~{formatteDate(trip?.tripTime.tripTo)}</div>}
                    </div>
                    <div className='w-full h-14 border-myzinc-200 border-1 flex items-center' >
                        <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollLeft}><FaAngleLeft /></div>
                        <div className='w-full h-full flex overflow-hidden' id="dateChoose" ref={scrollRef}>
                            {tripDaySchedule.map((item: TripDaySchedule) => {
                                return (
                                    <div key={item.id}
                                        onClick={() => selectDate(item.id, item.rawDate)}
                                        className={item.id === selectedDay.id ?
                                            'w-30 flex-shrink-0 text-sm-700 text-center border-b-5 border-primary-600 cursor-pointer '
                                            : 'w-30 flex-shrink-0 text-sm-400 text-center border-x-1 border-myzinc-200 cursor-pointer'}
                                    >
                                        <p>{item.date}</p>
                                        <p>第{item.number}天</p>
                                    </div>
                                )
                            })}
                            <div onClick={() => addTripDate()} className='w-26 flex flex-col flex-shrink-0 text-sm-700 text-myzinc-600 text-center border-x-1 border-myzinc-200 items-center cursor-pointer'>
                                <IoMdAdd className='w-6 h-6 m-auto' />
                                {/* <p >新增天數</p> */}
                            </div>
                        </div>
                        <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollRight}><FaAngleRight /></div>
                    </div>
                    <div id='dayContent' className='w-full flex-1'>
                        {tripDaySchedule
                            .filter(item => item.id === selectedDay.id)
                            .map(item => (
                                <TripAttractionItem key={item.id} tripDaySchedule={item} timestampToDateTime={timestampToDateTime} />
                            ))}

                    </div>
                </div>
            </div>
            <div className='w-full h-full flex-1' >
                <MapComponent countryData={countryData} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace}
                    selectedDay={selectedDay} setPendingPlace={setPendingPlace}
                    setShowTimePop={setShowTimePop} />
            </div>
        </div>
    )

}
