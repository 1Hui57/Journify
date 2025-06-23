'use client'
import { useEffect, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { serverTimestamp, setDoc, doc, FieldValue, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { v4 as uuidv4 } from 'uuid';
import CountrySelect from "./CountrySelect";
import { Country, PublicTrip } from "@/app/type/trip";

interface CreateTripProps {
    userId: string | undefined;
    setIsAddTrip: React.Dispatch<React.SetStateAction<boolean>>;
    updateCountryStatsOnCreate: (tripCountry: Country[]) => void;
    setSaveStatus: React.Dispatch<React.SetStateAction<"idle" | "saving" | "success" | "error">>;
}
interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface Trip {
    id?: string;
    tripName: string;
    person: number;
    tripTime: TripTime;
    isPublic: boolean;
    tripCountry: Country[];
    createAt: FieldValue;
    updateAt: FieldValue;
    tripPhotoUrl: string;
}

export default function CreateTrip({ userId, setIsAddTrip, updateCountryStatsOnCreate, setSaveStatus }: CreateTripProps) {

    const [selected, setSelected] = useState<DateRange | undefined>();
    const [deteText, setDateText] = useState<string>("");

    // 建立旅程資訊
    const [tripName, setTripName] = useState<string>("");
    const [tripPerson, setTripPerson] = useState<number | undefined>();
    const [tripTime, setTripTime] = useState<TripTime | undefined>();
    const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
    const defaultCoverPhotos = [
        "/default1.jpg",
        "/default2.jpg",
        "/default3.jpg",
        "/default4.jpg",
    ];

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
        if (!tripName || !tripPerson || !tripTime || selectedCountries.length === 0) {
            alert("請輸入旅程資訊！");
            return;
        }
        if (!userId) {
            alert("使用者未登入，請重新登入");
            return;
        }

        setSaveStatus("saving");
        
        const tripId = uuidv4();

        const newTrip: Trip = {
            tripName: tripName,
            person: Number(tripPerson),
            tripTime: tripTime,
            isPublic: false,
            tripCountry: selectedCountries,
            createAt: serverTimestamp(),
            updateAt: serverTimestamp(),
            tripPhotoUrl: getRandomCoverPhoto(),
        };
        const countryCodes = selectedCountries.map((item) => item.countryCode);
        const newAlltrip = {
            ...newTrip,
            userId,
            tripId,
            countryCodes,
            likeCount: 0
        }

        try {
            // 寫入使用者自己的旅程
            await setDoc(doc(db, "users", userId, "trips", tripId), newTrip);
            // 寫入all_trips，便於首頁查詢
            await setDoc(doc(db, "all_trips", tripId), newAlltrip);
            // 更新熱門國家統計表
            updateCountryStatsOnCreate(selectedCountries);
            setTripName("");
            setTripPerson(1);
            setTripTime(undefined);
            console.log("寫入成功");
            setSaveStatus("success");
            // 1.5 秒後隱藏 loading 並關閉視窗
            setTimeout(() => {
                setSaveStatus("idle");
                setIsAddTrip(false);
            }, 1500);
        }
        catch (error) {
            console.error(" 寫入 Firestore 失敗：", error);
            setSaveStatus("error");
            // 2 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1500);

        }
    }

    function getRandomCoverPhoto() {
        return defaultCoverPhotos[Math.floor(Math.random() * defaultCoverPhotos.length)];
    }

    return (
        <div className="fixed inset-0 bg-myzinc900-50  flex  items-center justify-center overflow-y-auto pt-47 2xl:pt-0" onClick={() => setIsAddTrip(false)}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-120 h-fit " onClick={(e) => e.stopPropagation()}>
                <div className="text-lg font-bold text-myblue-800 mb-2">建立旅程</div>
                <p className="text-myblue-600 font-light text-md "><span className="text-myred-400">* </span>旅程名稱</p>
                <input type="text" placeholder="輸入旅程名稱" value={tripName} onChange={(e) => { setTripName(e.target.value) }} className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>人數</p>
                <input type="number" placeholder="輸入旅程人數" value={tripPerson !== undefined ? tripPerson : ""} onChange={(e) => { personInputOnChange(e) }} className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>國家</p>
                <CountrySelect setSelectedCountries={setSelectedCountries} selectedCountries={selectedCountries} />
                <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>日期</p>
                <input type="text" placeholder="請選擇日期" readOnly className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1"
                    value={deteText} />
                <div className="w-fit mx-auto mt-2 text-primary-400 ">
                    <DayPicker mode="range" required selected={selected} onSelect={handleOnSelect}
                        className=""
                    />
                </div>
                <div className="w-fit h-fit flex ml-auto gap-3">
                    <button className="mt-4 px-4 py-2 text-base-400 text-myblue-600 rounded-full hover:bg-myzinc-200" onClick={() => { setIsAddTrip(false) }}>
                        取消
                    </button>
                    <button className="mt-4 px-4 py-2  text-myblue-600 bg-primary-300 text-base-500 rounded-full hover:text-primary-300 hover:bg-myblue-700"
                        onClick={handleClick}>
                        建立
                    </button>
                </div>
            </div>
        </div>
    )
}