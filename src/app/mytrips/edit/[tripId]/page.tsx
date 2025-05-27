'use client'

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { getDoc, doc, Timestamp, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { v4 as uuidv4 } from 'uuid';
import dynamic from 'next/dynamic';
import { FaAngleLeft } from "react-icons/fa6";
import { FaAngleRight } from "react-icons/fa6";
import { IoMdAdd } from "react-icons/io"; //加號
import { Country, SelectTripDay, Trip, TripDaySchedule, TripScheduleItem, TripTime, TripTransport } from '@/app/type/trip';
import TimeComponent from '@/component/TimeComponent';
import TripAttractionWrappwer from '@/component/TripAttractionWrapper';
import NoteComponent from '@/component/NoteComponent';

// redux
import { useSelector } from "react-redux";
import { TripEditRootState } from "@/store/tripEditStore";
import EditTimeComponent from '@/component/EditTimeComponent';

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
    const [countryData, setCountryData] = useState<Country[]>();

    // 取得此筆旅程資料
    const { tripId } = useParams();
    const [trip, setTrip] = useState<Trip>();

    // 旅程的每一天跟目前選擇哪一天
    const [tripDaySchedule, setTripDaySchedule] = useState<TripDaySchedule[]>([]);
    const [selectedDay, setSelectedDay] = useState<SelectTripDay>({ id: "", date: null });

    // map 資料
    const [selectedPlace, setSelectedPlace] = useState<any>(null);

    // 顯示timePop、NotePop
    const [showTimePop, setShowTimePop] = useState<boolean>(false);
    // 取的 Redux 狀態
    const showNotePopup = useSelector((state: TripEditRootState) => state.tripEdit.showNotePopup);
    const showEditTimePopup = useSelector((state: TripEditRootState) => state.tripEdit.showEditTimePopup);

    // 準備加入的景點資料 & 時間
    const [pendingPlace, setPendingPlace] = useState<TripScheduleItem | null>(null);

    // 儲存旅程資料
    const [isSaving, setIsSaving] = useState<boolean>(false);

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
            const days = generateTripDays(trip.tripTime.tripFrom, trip.tripTime.tripTo);
            setTripDaySchedule([...days]);
            if (
                days.length > 0 &&
                (selectedDay.id === "" || !days.some((day) => day.id === selectedDay.id))
            ) {
                setSelectedDay({ id: days[0].id, date: days[0].rawDate });
            }
        }
    }, [trip]);

    // countries 與 trip 都準備好後，才找對應國家
    useEffect(() => {
        if (!trip || countries.length === 0) return;

        // const matchedCountry = countries.map(
        //     (item) => item.countryName === trip.tripCountry
        // );

        setCountryData(trip.tripCountry);
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
                    attractionData: [],
                    transportData: []
                });
            }
            currentDate.setDate(currentDate.getDate() + 1); // 加一天
            dayCount++;
        }
        return days;
    };

    // 新增天數
    const addTripDate = () => {
        if (!trip) return;
        const originEndDate = trip.tripTime.tripTo.toDate();
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

    // 更新tripDaySchedul的atttaction的排序跟transport
    const updateTripScheduleWithTransport = (tripDaySchedule: TripDaySchedule[]): TripDaySchedule[] => {
        return tripDaySchedule.map((day) => {
            // attraction 按照時間排序
            const sortedAttractions = [...day.attractionData].sort((a, b) => {
                if (!a.startTime) return 1;
                if (!b.startTime) return -1;
                return a.startTime.toMillis() - b.startTime.toMillis();
            });
            //建立一個新的transport陣列用來放新的資料
            const newTransport: TripTransport[] = [];

            for (let i = 0; i < sortedAttractions.length - 1; i++) {
                const from = sortedAttractions[i];
                const to = sortedAttractions[i + 1];
                // 找有沒有已經有的transport資料
                const existing = day.transportData.find(
                    item => item.fromAttractionId === from.id && item.toAttractionId === to.id
                );

                if (existing) {
                    newTransport.push(existing);
                } else {
                    newTransport.push({
                        id: uuidv4(),
                        fromAttractionId: from.id,
                        toAttractionId: to.id,
                        fromAttractionPlaceId: from.place_id,
                        toAttractionPlaceId: to.place_id,
                        customDuration: 0,
                        selectedMode: "DRIVING",
                        note: ''
                    });
                }
            }

            return {
                ...day,
                attractionData: sortedAttractions,
                transportData: newTransport,
            };
        });
    };

    /**
    * 新增景點到指定的日期行程中
    * @param {string} dayId - 需要新增景點的日期 ID
    * @param {TripScheduleItem} tripScheduleItem - 要新增的景點數據
    */
    const addAttractionToDate = (dayId: string, tripScheduleItem: TripScheduleItem) => {
        setTripDaySchedule((prevSchedule) => {
            const newTripSchedule = prevSchedule.map((item) => {
                if (item.id === dayId) {
                    return {
                        ...item,
                        attractionData: [...item.attractionData, tripScheduleItem],
                    };
                }
                return item; // 其他日期保持不變
            });
            return updateTripScheduleWithTransport(newTripSchedule);
        });
    }

    /**
    * 從指定的日期中刪除指定景點
    * @param {string} dayId - 需要刪除景點的日期 ID
    * @param {string} tripScheduleItemId - 要刪除的景點 ID
    */
    const deleteAttractionfromDate = (dayId: string, tripScheduleItemId: string) => {
        setTripDaySchedule((prevSchedule) => {
            const newTripSchedule = prevSchedule.map((day) => {
                if (day.id === dayId) {
                    const newAttractions = day.attractionData.filter((item) => item.id !== tripScheduleItemId);
                    return {
                        ...day,
                        attractionData: newAttractions
                    }
                }
                else return day; // 其他日期保持不變
            });
            return updateTripScheduleWithTransport(newTripSchedule);
        });
    }

    // 編輯景點筆記
    const editAttractionNote = (dayId: string, tripScheduleItemId: string, note: string) => {
        setTripDaySchedule((prevSchedule) => {
            const newTripSchedule = prevSchedule.map((day) => {
                if (day.id === dayId) {
                    const newAttractions = day.attractionData.map((item) => {
                        if (item.id === tripScheduleItemId) {
                            return {
                                ...item,
                                note
                            }
                        }
                        return item;
                    })
                    return {
                        ...day,
                        attractionData: newAttractions
                    }
                }
                else return day; // 其他日期保持不變
            });
            return updateTripScheduleWithTransport(newTripSchedule);
        });
    }

    // 編輯景點時間
    const editAttractionTime = (dayId: string, tripScheduleItemId: string, time: TripTime) => {
        setTripDaySchedule((prevSchedule) => {
            const newTripSchedule = prevSchedule.map((day) => {
                if (day.id === dayId) {
                    const newAttractions = day.attractionData.map((item) => {
                        if (item.id === tripScheduleItemId) {
                            return {
                                ...item,
                                startTime: time.tripFrom,
                                endTime: time.tripTo
                            }
                        }
                        return item;
                    })
                    return {
                        ...day,
                        attractionData: newAttractions
                    }
                }
                else return day; // 其他日期保持不變
            });
            return updateTripScheduleWithTransport(newTripSchedule);
        });
    }

    // 儲存旅程，將目前旅程編輯資料寫入資料庫
    async function saveTripDaySchedule(userId: string, tripId: string, trip: Trip, tripDaySchedule: TripDaySchedule[]) {
        if (!userId || !tripId) {
            alert("使用者或旅程 ID 不正確");
            return;
        }
        setIsSaving(true);
        try {
            await setDoc(doc(db, "users", userId, "trips", tripId), {
                ...trip,
                tripDaySchedule: tripDaySchedule,
            });
            // 更新all_trips的updateTime
            await updateDoc(doc(db, "all_trips", tripId), {
                tripTime: trip.tripTime,
                updateAt: Timestamp.now(),
            });
            console.log("寫入成功");
            setIsSaving(false);
        }
        catch (error) {
            console.error(" 寫入 Firestore 失敗：", error);
            alert("新增資料時發生錯誤，請稍後再試！");
        }
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

    if (isLoading) return <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
        <img src="/loading.gif" className="w-30 h-30 " />
        <p className="text-mywhite-100">旅雀加載中...請稍後</p>
    </div>;

    return (
        <div className='w-full h-full flex flex-col-reverse md:flex-row'>
            {isSaving && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <div className='w-fit h-fit px-5 py-3 bg-mywhite-100 text-primary-800 text-base-500 '>
                    儲存成功!
                </div>
            </div>}
            {showTimePop && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <TimeComponent addAttractionToDate={addAttractionToDate} selectedDay={selectedDay} pendingPlace={pendingPlace}
                    setShowTimePop={setShowTimePop} setPendingPlace={setPendingPlace} dateTimeToTimestamp={dateTimeToTimestamp}
                    setSelectedPlace={setSelectedPlace} />
            </div>}
            {showNotePopup && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <NoteComponent editAttractionNote={editAttractionNote} selectedDay={selectedDay} />
            </div>}
            {showEditTimePopup && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <EditTimeComponent editAttractionTime={editAttractionTime} selectedDay={selectedDay} timestampToDateTime={timestampToDateTime} />
            </div>}
            <div className='h-70 md:w-[350px] flex-none md:h-full'>
                <div className='w-full h-full bg-mywhite-100 flex flex-col'>
                    <div className='w-full h-12 md:h-16 px-5 text-myzinc-800 flex items-center justify-between shadow-[0_0_8px_rgba(0,0,0,0.1)]'>
                        <div className='w-fit text-lg-700 md:text-2xl-700 line-clamp-1'>{trip?.tripName}</div>
                        {trip && <div className='w-fit text-base-400'>{formatteDate(trip?.tripTime.tripFrom)}~{formatteDate(trip?.tripTime.tripTo)}</div>}
                    </div>
                    <div className='w-full h-14 border-myzinc-200 border-1 flex items-center' >
                        <div className='w-fit h-full px-2 flex items-center border-x-1 border-myzinc-200 text-primary-600 cursor-pointer' onClick={scrollLeft}><FaAngleLeft /></div>
                        <div className='w-full h-full flex overflow-x-auto scroll-smooth no-scrollbar' id="dateChoose" ref={scrollRef}>
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
                    <div id='dayContent' className='w-full flex-1 overflow-y-scroll pb-12'>
                        {tripDaySchedule
                            .filter(item => item.id === selectedDay.id)
                            .map(item => (
                                <TripAttractionWrappwer key={item.id} tripDaySchedule={item} timestampToDateTime={timestampToDateTime} setTripDaySchedule={setTripDaySchedule}
                                    selectedDay={selectedDay} deleteAttractionfromDate={deleteAttractionfromDate} />
                            ))}
                    </div>
                </div>
            </div>
            <div className='w-full h-full flex-1' >
                <MapComponent countryData={countryData} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace}
                    selectedDay={selectedDay} setPendingPlace={setPendingPlace}
                    setShowTimePop={setShowTimePop} tripDaySchedule={tripDaySchedule} setTripDaySchedule={setTripDaySchedule} />
            </div>
            <div
                onClick={() => {
                    if (!userId || !tripId || typeof tripId !== "string" || !trip) return;
                    saveTripDaySchedule(userId, tripId, trip, tripDaySchedule)
                }}
                className="absolute bottom-3 right-5 w-fit h-fit px-5 py-2 border-2 border-primary-800 text-primary-800 text-sm-500 bg-mywhite-80 hover:bg-primary-800 hover:text-mywhite-100 hover:border-mywhite-100 text-center rounded-full cursor-pointer">儲存旅程</div>
        </div>
    )

}
