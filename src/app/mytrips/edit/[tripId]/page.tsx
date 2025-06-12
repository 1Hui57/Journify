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

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { useMediaPredicate } from "react-media-hook";

// redux
import { useSelector } from "react-redux";
import { TripEditRootState } from "@/store/tripEditStore";
import EditTimeComponent from '@/component/EditTimeComponent';
import TripDaySelect from '@/component/TripDaySelect';

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

    // 確認所有旅程景點圖片皆未過期
    const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(true);

    // 旅程的每一天跟目前選擇哪一天
    const [tripDaySchedule, setTripDaySchedule] = useState<TripDaySchedule[]>([]);
    const [selectedDay, setSelectedDay] = useState<SelectTripDay>({ id: "", date: null });

    // map 資料
    const [selectedPlace, setSelectedPlace] = useState<any>(null);

    // 顯示timePop、NotePop
    const [showTimePop, setShowTimePop] = useState<boolean>(false);

    // 取得 Redux 狀態
    const showNotePopup = useSelector((state: TripEditRootState) => state.tripEdit.showNotePopup);
    const showEditTimePopup = useSelector((state: TripEditRootState) => state.tripEdit.showEditTimePopup);

    // 準備加入的景點資料 & 時間
    const [pendingPlace, setPendingPlace] = useState<TripScheduleItem | null>(null);

    // 儲存旅程資料
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    // 監聽是不是手機尺寸
    const isMobile = useMediaPredicate('(max-width: 768px)');

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
            (tripData.tripDaySchedule)?.forEach(day => {
                day.rawDate = (day.rawDate as unknown as Timestamp).toDate()
            })
            setTrip(tripData);
            setIsPhotoLoading(true);
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

    // countries 與 trip 都準備好後，才找對應國家
    useEffect(() => {
        if (!trip || countries.length === 0) return;
        setCountryData(trip.tripCountry);
    }, [trip, countries]);

    // 當三樣關鍵資料都存在後才解除 loading
    useEffect(() => {
        if (trip && tripDaySchedule.length > 0 && countries.length > 0 && countryData) {
            setIsloading(false);
            console.log(tripDaySchedule);
        }
    }, [trip, tripDaySchedule, countries, countryData]);

    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollLeft = () => {
        scrollRef.current?.scrollBy({ left: -150, behavior: 'smooth' });
    };

    const scrollRight = () => {
        scrollRef.current?.scrollBy({ left: 150, behavior: 'smooth' });
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
    * 新增天數
    */
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

    /**
    * 更新 tripDaySchedul的 attractionData 的排序跟 transportData
    * @param {TripDaySchedule[]} tripDaySchedule - 每天的旅程資訊陣列
    */
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

    /**
    * 編輯景點筆記
    * @param {string} dayId - 正在編輯的當天 ID
    * @param {string} tripScheduleItemId - 正在編輯的景點 ID
    * @param {string} note - 筆記內容
    */
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

    /**
    * 編輯景點時間
    * @param {string} dayId - 正在編輯的當天 ID
    * @param {string} tripScheduleItemId - 正在編輯的景點 ID
    * @param {TripTime} time - 更新的景點時間
    */
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

    /**
    * 刪除旅程天數
    * @param {string} deleteDayId - 要刪除的當天 ID
    */
    const deleteTripDate = (deleteDayId: string) => {
        const deleteDay = trip?.tripDaySchedule?.find(item => item.id === deleteDayId);
        if (!deleteDay) return;

        const deletedDate = deleteDay.rawDate;

        const updatedTripDaySchedule = tripDaySchedule.filter(day => day.id !== deleteDayId).map(day => {
            // 如果刪除6/2，6/3會進到這個部分的程式碼，6/3比6/2大
            if (day.rawDate > deletedDate) {
                const newDate = new Date(day.rawDate);
                newDate.setDate(newDate.getDate() - 1);

                const month = String(newDate.getMonth() + 1).padStart(2, '0');
                const date = String(newDate.getDate()).padStart(2, '0');

                // 更新景點時間
                const updatedAttractions = day.attractionData.map(item => {
                    const updatedStart = item.startTime
                        ? Timestamp.fromDate(new Date(item.startTime.toDate().setDate(item.startTime.toDate().getDate() - 1)))
                        : undefined;

                    const updatedEnd = item.endTime
                        ? Timestamp.fromDate(new Date(item.endTime.toDate().setDate(item.endTime.toDate().getDate() - 1)))
                        : undefined;

                    return {
                        ...item,
                        startTime: updatedStart,
                        endTime: updatedEnd
                    };
                });

                return {
                    ...day,
                    rawDate: newDate,
                    date: `${month}月${date}日`,
                    number: day.number - 1,
                    attractionData: updatedAttractions
                };
            } else {
                return day;
            }
        });
        // 如果刪除的是正在選擇的那一天，要讓 selectedDay 改到新的第一天
        if (selectedDay.id === deleteDayId) {
            if (updatedTripDaySchedule.length > 0) {
                setSelectedDay({ id: updatedTripDaySchedule[0].id, date: updatedTripDaySchedule[0].rawDate });
            }
        }

        // 如果你有 tripTime 的 tripTo，要記得往前一天
        if (trip) {
            const newTripTo = new Date(trip.tripTime.tripTo.toDate());
            newTripTo.setDate(newTripTo.getDate() - 1);

            setTrip({
                ...trip,
                tripTime: {
                    ...trip.tripTime,
                    tripTo: Timestamp.fromDate(newTripTo)
                },
                tripDaySchedule:updatedTripDaySchedule,
            });
        }

    }

    /**
    * 儲存旅程，將目前旅程編輯資料寫入資料庫
    * @param {string} userId - 使用者 ID
    * @param {string} tripId - 此旅程 ID
    * @param {Trip} trip - 此旅程的概要資料
    * @param {TripDaySchedule[]} tripDaySchedule -此旅程的詳細排程
    */
    async function saveTripDaySchedule(userId: string, tripId: string, trip: Trip, tripDaySchedule: TripDaySchedule[]) {
        if (!userId || !tripId) {
            alert("使用者或旅程 ID 不正確");
            return;
        }
        setSaveStatus("saving");
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
            setSaveStatus("success");
            // 1.5 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1000);
        }
        catch (error) {
            console.error(" 寫入 Firestore 失敗：", error);
            setSaveStatus("error");
            // 2 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1500);
        }
    }

    /**
    * 將Date與時間字串轉為TimeStamp資料格式
    * @param {Date} date - 當天的Date
    * @param {string} time - 時間 ex.1030
    */
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

    /**
    * 將TimeStamp資料格式轉為Date與時間字串
    * @param {Timestamp} timeStamp - 待轉換的TimeStamp
    */
    function timeStampToDateTime(timeStamp: Timestamp) {
        const date = timeStamp.toDate();
        const time = date.toTimeString().slice(0, 5);
        return { date, time };
    }

    if (isLoading) return <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
        <img src="/loading.gif" className="w-30 h-30 " />
        <p className="text-mywhite-100">旅雀加載中...請稍後</p>
    </div>;

    return (
        <div className='w-full h-full flex flex-col-reverse md:flex-row'>
            {saveStatus !== "idle" && (
                <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <div className='w-fit h-fit px-5 py-3  text-mywhite-100 text-base-500'>
                        {saveStatus === "saving" && <span >儲存中...</span>}
                        {saveStatus === "success" && <span >儲存成功！</span>}
                        {saveStatus === "error" && <span >儲存失敗，請稍後再試</span>}
                    </div>
                </div>)}
            {showTimePop && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <TimeComponent addAttractionToDate={addAttractionToDate} selectedDay={selectedDay} pendingPlace={pendingPlace}
                    setShowTimePop={setShowTimePop} setPendingPlace={setPendingPlace} dateTimeToTimestamp={dateTimeToTimestamp}
                    setSelectedPlace={setSelectedPlace} />
            </div>}
            {showNotePopup && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <NoteComponent editAttractionNote={editAttractionNote} selectedDay={selectedDay} />
            </div>}
            {showEditTimePopup && <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                <EditTimeComponent editAttractionTime={editAttractionTime} selectedDay={selectedDay} timeStampToDateTime={timeStampToDateTime} />
            </div>}

            {/* 主內容 PanelGroup */}
            <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className={`w-full h-full flex ${isMobile ? "flex-col-reverse" : "flex-row"}`}>
                <Panel defaultSize={isMobile ? 50 : 35} minSize={35}>
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
                                        <TripDaySelect key={item.id} item={item} selectedDay={selectedDay} selectDate={selectDate} deleteTripDate={deleteTripDate}/>
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
                                    <TripAttractionWrappwer key={item.id} tripDaySchedule={item} timeStampToDateTime={timeStampToDateTime} setTripDaySchedule={setTripDaySchedule}
                                        selectedDay={selectedDay} deleteAttractionfromDate={deleteAttractionfromDate} />
                                ))}
                        </div>
                    </div>
                </Panel>
                {/* 中間可拖拉分隔線 */}
                <PanelResizeHandle className={
                    isMobile ? "h-[12px] w-full bg-gray-300 cursor-ns-resize active:bg-primary-600" : "w-[6px] bg-gray-300 cursor-ew-resize hover:bg-primary-600"} />

                <Panel defaultSize={isMobile ? 50 : 40} minSize={isMobile ? 50 : 40}>
                    <MapComponent countryData={countryData} selectedPlace={selectedPlace} setSelectedPlace={setSelectedPlace}
                        selectedDay={selectedDay} setPendingPlace={setPendingPlace}
                        setShowTimePop={setShowTimePop} tripDaySchedule={tripDaySchedule} setTripDaySchedule={setTripDaySchedule} isPhotoLoading={isPhotoLoading} setIsPhotoLoading={setIsPhotoLoading} trip={trip} setTrip={setTrip} />
                </Panel>
            </PanelGroup>
            <div
                onClick={() => {
                    if (!userId || !tripId || typeof tripId !== "string" || !trip) return;
                    // console.log('tripDaySchedule to save:', tripDaySchedule);
                    saveTripDaySchedule(userId, tripId, trip, tripDaySchedule)
                }}
                className="absolute bottom-3 right-5 w-fit h-fit px-5 py-2 border-2 border-primary-800 text-primary-800 text-sm-500 bg-mywhite-80 hover:bg-primary-800 hover:text-mywhite-100 hover:border-mywhite-100 text-center rounded-full cursor-pointer">儲存旅程</div>
        </div>
    )

}
