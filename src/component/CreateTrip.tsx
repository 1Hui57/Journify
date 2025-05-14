'use client'
import { Dispatch, useEffect, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { serverTimestamp, addDoc, setDoc, collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from 'uuid';
import CountrySelect from "./CountrySelect";

interface CreateTripProps {
    userId: string | undefined;
    setIsAddTrip: React.Dispatch<React.SetStateAction<boolean>>;
}
interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface Trip {
    id?: string;
    tripName: string;
    person: Number;
    tripTime: TripTime;
    isPublic: Boolean;
}
export default function CreateTrip({ userId, setIsAddTrip }: CreateTripProps) {

    const [selected, setSelected] = useState<DateRange | undefined>();
    const [deteText, setDateText] = useState<string>("");

    // 建立旅程資訊
    const [tripName, setTripName] = useState<string>("");
    const [tripPerson, setTripPerson] = useState<number | undefined>();
    const [tripTime, setTripTime] = useState<TripTime | undefined>();
    const [tripCountry, setTripCountry] = useState<string>("");

    // 人數input規則
    const personInputOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value;
        if (value === "") {
            setTripPerson(undefined);
            return
        }
        let num = Number(value);
        if (num < 1) { num = 1; }
        // 移除小數點（轉為整數）
        num = Math.floor(num);
        setTripPerson(num);
    }

    // 選取日期
    function handleOnSelect(range: DateRange | undefined, triggerDate: Date) {
        // 如果還沒選開始日期
        if (!selected?.from) {
            setSelected({
                from: triggerDate,
                to: undefined,
            });
        }
        // 如果還沒選結束日期
        else if (!selected?.to) {
            // 如果to的日期早於from，現在選擇日期的改成from
            if (triggerDate < selected.from) {
                setSelected({
                    from: triggerDate,
                    to: undefined,
                })
                return;
            }
            setSelected({
                from: selected.from,
                to: triggerDate,
            });
        }
        // 如果開始與結束日期都已選，則重新選取範圍
        else {
            setSelected({
                from: triggerDate,
                to: undefined,
            });
        }
    }

    // 日期input顯示
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
        if (!userId) {
            alert("使用者未登入，請重新登入");
            return;
        }

        const tripId = uuidv4();

        const newTrip: Trip = {
            tripName: tripName,
            person: Number(tripPerson),
            tripTime: tripTime,
            isPublic: false
        };
        const newAlltrip = {
            ...newTrip,
            userId: userId,
            tripId: tripId,
            createdAt: serverTimestamp(),
        }

        try {
            // 寫入使用者自己的旅程
            await setDoc(doc(db, "users", userId, "trips", tripId), newTrip);
            // 寫入all_trips，便於首頁查詢
            await setDoc(doc(db, "all_trips", tripId), newAlltrip);
            setTripName("");
            setTripPerson(1);
            setTripTime(undefined);
            setIsAddTrip(false);
            console.log("寫入成功");
        }
        catch (error) {
            console.error(" 寫入 Firestore 失敗：", error);
            alert("新增資料時發生錯誤，請稍後再試！");
        }
    }

    return (
        <div className="fixed inset-0 bg-myzinc900-50  flex  items-center justify-center overflow-y-auto pt-47" onClick={() => setIsAddTrip(false)}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-120 h-fit " onClick={(e) => e.stopPropagation()}>
                <div className="text-lg font-bold text-myblue-800 mb-2">建立旅程</div>
                <p className="text-myblue-600 font-light text-md "><span className="text-myred-400">* </span>旅程名稱</p>
                <input type="text" placeholder="輸入旅程名稱" value={tripName} onChange={(e) => { setTripName(e.target.value) }} className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>人數</p>
                <input type="number" placeholder="輸入旅程人數" value={tripPerson !== undefined ? tripPerson : ""} onChange={(e) => { personInputOnChange(e) }} className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>國家</p>
                <CountrySelect setTripCountry={setTripCountry}/>
                <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>日期</p>
                <input type="text" placeholder="請選擇日期" readOnly className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1"
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
    )
}