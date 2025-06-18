'use client'
import { Country, PublicTrip, SelectTripDay, Trip, TripDaySchedule, TripScheduleItem } from '@/app/type/trip';
import MapComponent from '@/component/Map';
import SharingAttractionWrappwer from '@/component/sharingPageComponent/SharingAttractionWrapper';
import SharingMapComponent from '@/component/sharingPageComponent/SharingMap';
import TripAttractionWrappwer from '@/component/TripAttractionWrapper';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { SetStateAction, useEffect, useRef, useState } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';
import { useMediaPredicate } from 'react-media-hook';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import dynamic from 'next/dynamic';

// 用dynamic包住map
const SharingMap = dynamic(() => import('@/component/sharingPageComponent/SharingMap'), {
    ssr: false, // 禁止 server side render，避免 Google Maps 衝突
    loading: () => <div>地圖載入中...</div>
});

export default function SharingTripPage() {

    const router = useRouter();
    const [isLoading, setIsloading] = useState<boolean>(true);
    // 取得此筆旅程資料
    const params = useParams();
    const tripId = typeof params.tripId === "string" ? params.tripId : params.tripId?.[0];
    const [trip, setTrip] = useState<Trip>();
    const [userId, setUserId] = useState<string | null>(null);
    const [countries, setCountries] = useState<Country[]>([]);
    const [countryData, setCountryData] = useState<Country[]>();

    // 旅程的每一天跟目前選擇哪一天
    const [tripDaySchedule, setTripDaySchedule] = useState<TripDaySchedule[]>([]);
    const [selectedDay, setSelectedDay] = useState<SelectTripDay>({ id: "", date: null });

    // 確認所有旅程景點圖片皆未過期
    const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(true);

    // 監聽是不是手機尺寸
    const isMobile = useMediaPredicate('(max-width: 768px)');

    // map 資料
    const [selectedPlace, setSelectedPlace] = useState<any>(null);

    // 顯示timePop、NotePop
    const [showTimePop, setShowTimePop] = useState<boolean>(false);

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

    // 載入國家資料
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error("載入國家失敗", error));
    }, []);

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
            (tripData.tripDaySchedule)?.forEach(day => {
                day.rawDate = (day.rawDate as unknown as Timestamp).toDate()
            })
            setTrip(tripData);
        };

        fetchTrip();
        setIsloading(false);
    }, [tripId, userId]);

    // countries 與 trip 都準備好後，才找對應國家
    useEffect(() => {
        if (!trip || countries.length === 0) return;
        setCountryData(trip.tripCountry);
    }, [trip, countries]);

    // 載入旅程資料後呈現第一天的排程

    // 轉換旅程天數
    useEffect(() => {
        if (!trip) return;

        if (trip.tripDaySchedule && trip.tripDaySchedule.length > 0 && tripDaySchedule.length === 0) {
            const convertTripDaySchedule: TripDaySchedule[] = trip.tripDaySchedule.map((dayItem) => ({
                ...dayItem,
                rawDate:
                    dayItem.rawDate instanceof Timestamp
                        ? dayItem.rawDate.toDate()
                        : new Date(dayItem.rawDate),
                attractionData: dayItem.attractionData.map((item) => ({
                    ...item,
                })),
            }));
            setTripDaySchedule(convertTripDaySchedule);
            setSelectedDay({ id: convertTripDaySchedule[0].id, date: convertTripDaySchedule[0].rawDate, });
        } else {
            console.log("根據 tripTime 重新生成或更新行程天數");
            const days = generateTripDays(trip);
            setTripDaySchedule([...days]);
            if (
                days.length > 0 &&
                (selectedDay.id === "" || !days.some((day) => day.id === selectedDay.id))
            ) {
                setSelectedDay({ id: days[0].id, date: days[0].rawDate });
            }
        }
    }, [trip]);

    /**
    * 將整筆旅程資料轉換為 TripDaySchedule[]
    * @param {Trip} trip - 整筆旅程資料
    */
    const generateTripDays = (trip: Trip): TripDaySchedule[] => {
        const days = trip.tripDaySchedule || [];
        const currentDate = trip.tripTime.tripFrom.toDate();
        const endDate = trip.tripTime.tripTo.toDate();
        let dayCount = 1;
        while (currentDate <= endDate) {
            const exists = days.find((item) => {
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
                    attractionData: [],
                    transportData: []
                });
            }
            currentDate.setDate(currentDate.getDate() + 1); // 加一天
            dayCount++;
        }
        return days;
    };

    /**
    * 將 TimeStamp 時間格式轉成字串2025/06/12
    * @param {Timestamp} date - 需要轉換的時間
    */
    const formatteDate = (date: Timestamp) => {
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
        <div className='h-[calc(100vh-73px)] w-screen flex flex-col'>
            {isLoading &&
                <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <p className="text-mywhite-100">旅雀加載中...請稍後</p>
                </div>
            }
            {/* 主內容 PanelGroup */}
            <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className={`flex flex-1 h-full min-h-0 ${isMobile ? "flex-col-reverse" : "flex-row"}`}>
                <Panel defaultSize={isMobile ? 50 : 35} minSize={35} className='flex flex-col flex-1 h-full'>
                    <div className='w-full h-full bg-mywhite-100 flex flex-col'>
                        <div className='w-full h-12 md:h-16 px-5 text-myzinc-800 flex items-center justify-between shadow-[0_0_8px_rgba(0,0,0,0.1)]'>
                            <div className='w-fit text-lg-700 md:text-2xl-700 line-clamp-1'>{trip?.tripName}</div>
                            {trip && <div className='w-fit text-base-400'>{formatteDate(trip?.tripTime.tripFrom)}~{formatteDate(trip?.tripTime.tripTo)}</div>}
                        </div>
                        <div className='w-full h-14 border-myzinc-200 border-1 flex items-center' >
                            <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollLeft}><FaAngleLeft /></div>
                            <div className='w-full h-full flex overflow-x-auto scroll-smooth no-scrollbar' id="dateChoose" ref={scrollRef}>
                                {tripDaySchedule && tripDaySchedule.map((item: TripDaySchedule) => {
                                    return (
                                        <div key={item.id}
                                            onClick={() => setSelectedDay({ id: item.id, date: item.rawDate })}
                                            className={item.id === selectedDay.id ?
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
                            {tripDaySchedule && tripDaySchedule
                                .filter(item => item.id === selectedDay.id)
                                .map(item => (
                                    <SharingAttractionWrappwer key={item.id} tripDaySchedule={item} timestampToDateTime={timestampToDateTime}
                                    />
                                ))}
                            {tripDaySchedule && tripDaySchedule
                                .filter(item => item.id === selectedDay.id)[0]?.attractionData.length === 0 && (
                                    <div className="w-full h-full flex items-center justify-center text-myzinc-400 text-sm">
                                        當天無景點
                                    </div>
                                )}
                        </div>
                    </div>

                </Panel>
                {/* 中間可拖拉分隔線 */}
                <PanelResizeHandle className={
                    isMobile ? "h-[12px] w-full bg-gray-300 cursor-ns-resize active:bg-primary-600" : "w-[6px] bg-gray-300 cursor-ew-resize hover:bg-primary-600"} />

                <Panel defaultSize={isMobile ? 50 : 40} minSize={isMobile ? 50 : 40}>
                    <SharingMap countryData={countryData} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace}
                        selectedDay={selectedDay}
                        setShowTimePop={setShowTimePop} tripDaySchedule={tripDaySchedule} setTripDaySchedule={setTripDaySchedule} isPhotoLoading={isPhotoLoading} setIsPhotoLoading={setIsPhotoLoading} trip={trip} setTrip={setTrip} />
                </Panel>
            </PanelGroup>

        </div>

    )
}

