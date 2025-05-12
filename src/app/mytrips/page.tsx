'use client'
import TripPageCard from "@/component/TripPageCard";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { IoMdAdd } from "react-icons/io";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { auth } from '@/lib/firebase';
import { serverTimestamp, addDoc, collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from "firebase/firestore";

export default function MyTrips() {
    interface TripTime {
        tripFrom: Date;
        tripTo: Date;
    }
    interface Trip {
        id?: string;
        tripName: string;
        person: Number;
        tripTime: TripTime;
    }
    interface FirestoreTripTime {
        tripFrom: Timestamp;
        tripTo: Timestamp;
    }

    interface FirestoreTrip {
        tripName: string;
        person: number;
        tripTime: FirestoreTripTime;
    }
    const router = useRouter();

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;

    // 建立旅程狀態
    const [isAddTrip, setIsAddTrip] = useState<boolean>(false);
    const [selected, setSelected] = useState<DateRange | undefined>();
    const [deteText, setDateText] = useState<string>("");

    // 建立旅程資訊
    const [tripName, setTripName] = useState<string>("");
    const [tripPerson, setTripPerson] = useState<number>(1);
    const [tripTime, setTripTime] = useState<TripTime | undefined>();

    // 使用者資料庫的旅程資料
    const [trips, setTrips] = useState<Trip[]>([]);

    // 取得使用者的旅程
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "trips")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Trip[] = snapshot.docs.map((doc) => {
                const tripData = doc.data() as FirestoreTrip;

                const tripTime = {
                    tripFrom: tripData.tripTime.tripFrom.toDate(),
                    tripTo: tripData.tripTime.tripTo.toDate(),
                };

                return {
                    id: doc.id,
                    tripName: tripData.tripName,
                    person: tripData.person,
                    tripTime,
                };
            });
            setTrips(data);
        });

        // return unsubscribe function to clean up
        return () => unsubscribe();

    }, [user?.uid]);

    // 使用者是否為登入狀態
    useEffect(() => {
        if (!isUserSignIn && !loading) {
            router.push("/login")
        }
    }, [isUserSignIn, loading])

    // 選取日期
    function handleOnSelect(range: DateRange | undefined, triggerDate: Date) {
        if (selected?.from && selected?.to) {
            setSelected({
                from: triggerDate,
                to: undefined,
            });
            return;
        }
        setSelected(range);
    }

    //input日期顯示
    useEffect(() => {
        if (selected?.from && selected?.to) {
            const formattedFrom = selected.from.toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            const formattedTo = selected.to.toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            setDateText(`${formattedFrom} ~ ${formattedTo}`);
            setTripTime({ tripFrom: selected.from, tripTo: selected.to })
        }
    }, [selected])

    // 建立旅程，寫入資料庫，進入旅程編輯頁
    async function handleClick() {
        if (!tripName || !tripPerson || !tripTime) {
            alert("請輸入旅程資訊！");
            return;
        }
        if (!user || !user.uid) {
            alert("使用者未登入，請重新登入");
            return;
        }

        const newTrip: Trip = {
            tripName: tripName,
            person: tripPerson,
            tripTime: tripTime
        };

        try {
            await addDoc(collection(db, "users", user.uid, "trips"), newTrip);
            // setSpendings([...spendings,{id:Math.random(),type,cost: Number(cost),content}]);
            setTripName("");
            setTripPerson(1);
            setTripTime(undefined);
            console.log("寫入成功");
            setIsAddTrip(false);
        }
        catch (error) {
            console.error(" 寫入 Firestore 失敗：", error);
            alert("新增資料時發生錯誤，請稍後再試！");
        }
    }

    return (
        <div className="w-full h-full ">
            <div className="w-full h-fit flex flex-col p-10 mb-20">
                <div className="w-fit h-fit mb-6">
                    <p className="text-3xl font-bold text-myblue-800">我的旅程</p>
                </div>
                <div id="tripsWrapper" className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full ">
                    {/* trip card */}
                    {trips.map((item) => (<TripPageCard key={item.id} tripName={item.tripName} tripPerson={item.person} tripTime={item.tripTime} />))}


                </div>
                <button className="fixed bottom-6 right-10 w-30 h-10 bg-primary-300 ml-auto 
                rounded-full text-base text-myblue-600 font-bold flex items-center 
                justify-center gap-1 transition-transform duration-200 hover:bg-myblue-700
                 hover:text-primary-300" onClick={() => setIsAddTrip(true)}>
                    <IoMdAdd />
                    建立旅程
                </button>
            </div>
            {isAddTrip && (
                <div className="fixed inset-0 bg-myzinc900-50  flex  items-center justify-center overflow-y-auto" onClick={() => setIsAddTrip(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-lg w-120 h-168 mt-20 md:mt-0" onClick={(e) => e.stopPropagation()}>
                        <div className="text-lg font-bold text-myblue-800 mb-2">建立旅程</div>
                        <p className="text-myblue-600 font-light text-md "><span className="text-myred-400">* </span>旅程名稱</p>
                        <input type="text" placeholder="輸入旅程名稱" value={tripName} onChange={(e) => { setTripName(e.target.value) }} className="w-full h-12 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                        <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>人數</p>
                        <input type="number" placeholder="輸入旅程人數" min={1} value={tripPerson} onChange={(e) => { setTripPerson(Number(e.target.value)) }} className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                        <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>日期</p>
                        <input type="text" placeholder="請選擇日期" readOnly className="w-full h-12 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1"
                            value={deteText} />
                        <div className="w-fit mx-auto mt-2 text-primary-400 ">
                            <DayPicker mode="range" required selected={selected} onSelect={handleOnSelect}
                                className=""
                            />
                        </div>
                        <div className="w-fit h-fit flex ml-auto gap-3">
                            <button className="mt-4 px-4 py-2  text-myblue-800 rounded-full hover:bg-myzinc-200" onClick={() => { setIsAddTrip(false) }}>
                                取消
                            </button>
                            <button className="mt-4 px-4 py-2 text-myblue-800 bg-primary-300 text-base-400 rounded-full hover:text-primary-300 hover:bg-myblue-600"
                                onClick={handleClick}>
                                建立
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )


}