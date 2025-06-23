'use client'
import { useEffect, useState } from "react";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { serverTimestamp, setDoc, doc, FieldValue, Timestamp, Firestore, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { v4 as uuidv4 } from 'uuid';
import CountrySelect from "./CountrySelect";
import { Country, PublicTrip, TripDaySchedule, TripTime } from "@/app/type/trip";
import { useAuth } from "@/context/AuthContext";

interface UpdateTripProps {
    userId: string | undefined;
    setIsEditingTrip: React.Dispatch<React.SetStateAction<boolean>>;
    editTripData: Trip | null;
    setSaveStatus: React.Dispatch<React.SetStateAction<"idle" | "saving" | "success" | "error">>;
    updateCountryStatsOnEdit: (oldCountries: Country[], newCountries: Country[]) => void;
}
interface Trip {
    id?: string;
    tripName: string;
    person: number;
    tripTime: {
        tripFrom: Timestamp;
        tripTo: Timestamp;
    };
    isPublic: boolean;
    tripCountry: Country[];
    createAt: Timestamp;
    updateAt: Timestamp;
    tripDaySchedule?: TripDaySchedule[] | null;
}

export default function UpdateTrip({ userId, setIsEditingTrip, editTripData, setSaveStatus, updateCountryStatsOnEdit }: UpdateTripProps) {

    const [selected, setSelected] = useState<DateRange | undefined>();
    const [deteText, setDateText] = useState<string>("");

    // 建立旅程資訊
    const [tripName, setTripName] = useState<string>("");
    const [tripPerson, setTripPerson] = useState<number | undefined>();
    const [tripTime, setTripTime] = useState<TripTime | undefined>();
    const [selectedCountries, setSelectedCountries] = useState<Country[]>([]);
    const tripId = editTripData?.id;
    const [trip, setTrip] = useState<Trip | null>(null);
    const oldCountries = editTripData?.tripCountry;
    // 原本旅程的天數
    const [tripDays, setTripDays] = useState<number | null>(null);

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
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
        // 還沒選開始日期
        if (!selected?.from) {
            setSelected({
                from: triggerDate,
                to: undefined,
            });
            return;
        }

        // 已選開始但還沒選結束
        if (!selected?.to) {
            if (triggerDate < selected.from) {
                setSelected({
                    from: triggerDate,
                    to: undefined,
                });
                return;
            }

            // 計算選取的天數
            const timeDiff = triggerDate.getTime() - selected.from.getTime();
            const selectedDays = Math.floor(timeDiff / (1000 * 60 * 60 * 24)) + 1;

            // 如果選擇的天數不等於原本旅程天數，重新選起始日
            if (selectedDays !== tripDays) {
                alert(`請選擇剛好 ${tripDays} 天的範圍`);
                setSelected({
                    from: triggerDate,
                    to: undefined,
                });
                return;
            }

            // 成功選取正確天數
            setSelected({
                from: selected.from,
                to: triggerDate,
            });
            return;
        }

        // 如果 from 和 to 都已選，重新選新的 from
        setSelected({
            from: triggerDate,
            to: undefined,
        });
    }

    // 取得使用者資料庫的旅程資料
    useEffect(() => {
        if (!user || !editTripData?.id || !userId) return;

        const tripId = editTripData?.id;

        const fetchTrip = async () => {
            const tripRef = doc(db, "users", userId, "trips", tripId);
            const tripSnap = await getDoc(tripRef);

            if (!tripSnap.exists()) return;

            const tripData = tripSnap.data() as Trip;
            (tripData.tripDaySchedule)?.forEach(day => {
                day.rawDate = (day.rawDate as unknown as Timestamp).toDate()
            });
            setTrip(tripData);
        };

        fetchTrip();
    }, [user?.uid, editTripData, userId]);

    // 取得目前旅程的概覽資訊
    useEffect(() => {
        if (!editTripData) return;
        setTripName(editTripData?.tripName);
        setTripPerson(editTripData.person);
        if (editTripData?.tripTime.tripFrom && editTripData?.tripTime.tripTo) {

            const from = new Date(editTripData.tripTime.tripFrom.toDate());
            const to = new Date(editTripData.tripTime.tripTo.toDate());
            const diffTime = to.getTime() - from.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 加 1 是因為從 6/1 到 6/5 是 5 天
            setTripDays(diffDays);

            const formattedFrom = editTripData.tripTime.tripFrom.toDate().toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            const formattedTo = editTripData.tripTime.tripTo.toDate().toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            setDateText(`${formattedFrom} ~ ${formattedTo}`);
            setTripTime(editTripData.tripTime);
        }
        setSelectedCountries(editTripData.tripCountry);
    }, [editTripData])

    // 日期input顯示
    useEffect(() => {
        if (!trip) return;
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
            setTripTime({ tripFrom: Timestamp.fromDate(selected.from), tripTo: Timestamp.fromDate(selected.to) });
            const timeUpdatedTrip = updateTripTime({ tripFrom: Timestamp.fromDate(selected.from), tripTo: Timestamp.fromDate(selected.to) }, trip);
            setTrip(timeUpdatedTrip);
        }
    }, [selected])

    // 更新旅程的所有時間
    const updateTripTime = (newTripTime: TripTime, trip: Trip): Trip => {
        if (!trip.tripDaySchedule) {
            return ({
                ...trip,
                tripTime: newTripTime
            })
        };

        const fromDate = newTripTime.tripFrom.toDate();

        const updatedTripDays = trip.tripDaySchedule.map((day, index) => {
            const newRawDate = new Date(fromDate);
            newRawDate.setDate(fromDate.getDate() + index);

            const month = (newRawDate.getMonth() + 1).toString().padStart(2, '0');
            const dayNum = newRawDate.getDate().toString().padStart(2, '0');
            const formattedDate = `${month}月${dayNum}日`;

            const updatedAttractions = day.attractionData.map(attraction => {
                const updatedAttraction = { ...attraction };

                // 更新 startTime
                if (attraction.startTime) {
                    const original = attraction.startTime.toDate();
                    const newStart = new Date(newRawDate);
                    newStart.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0);
                    updatedAttraction.startTime = Timestamp.fromDate(newStart);
                }

                // 更新 endTime
                if (attraction.endTime) {
                    const original = attraction.endTime.toDate();
                    const newEnd = new Date(newRawDate);
                    newEnd.setHours(original.getHours(), original.getMinutes(), original.getSeconds(), 0);
                    updatedAttraction.endTime = Timestamp.fromDate(newEnd);
                }

                return updatedAttraction;
            });

            return {
                ...day,
                rawDate: newRawDate,
                date: formattedDate,
                number: index + 1,
                attractionData: updatedAttractions
            };
        });

        return {
            ...trip,
            tripTime: newTripTime,
            tripDaySchedule: updatedTripDays,
            updateAt: Timestamp.now(),
        };
    };

    // 更新旅程，寫入資料庫
    async function updateTrip(userId: string, tripId: string, trip: Trip) {
        if (!tripName || !tripPerson || !tripTime || selectedCountries.length === 0 || !oldCountries) {
            alert("請輸入旅程資訊！");
            return;
        }
        if (!userId) {
            alert("使用者未登入，請重新登入");
            return;
        }

        if (!trip) return;
        setSaveStatus("saving");
        const newTrip: Trip = {
            ...trip,
            tripName: tripName,
            person: tripPerson,
            tripTime: tripTime,
            tripCountry: selectedCountries,
            updateAt: Timestamp.now(),
        };
        const countryCodes = selectedCountries.map((item) => item.countryCode);
        const newAlltrip = {
            userId: userId,
            tripId,
            tripName: tripName,
            person: tripPerson,
            tripTime: tripTime,
            isPublic: trip.isPublic,
            tripCountry: selectedCountries,
            createAt: trip.createAt,
            countryCodes,
            updateAt: Timestamp.now(),
        }
        try {
            await setDoc(doc(db, "users", userId, "trips", tripId), { ...newTrip });
            // 更新all_trips的updateTime
            await updateDoc(doc(db, "all_trips", tripId), { ...newAlltrip });
            // 更新熱門國家統計表
            updateCountryStatsOnEdit(oldCountries,selectedCountries);
            console.log("寫入成功");
            setSaveStatus("success");
            // 1.5 秒後隱藏 loading 並關閉視窗
            setTimeout(() => {
                setSaveStatus("idle");
                setIsEditingTrip(false);
            }, 1500);
        }
        catch (error) {
            console.error(" 寫入 Firestore 失敗：", error);
            setSaveStatus("error");
            // 2 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1500);

        }
    }

    return (
        <div className="fixed inset-0 bg-myzinc900-50  flex  items-center justify-center overflow-y-auto pt-47" onClick={() => setIsEditingTrip(false)}>
            <div className="bg-white p-6 rounded-lg shadow-lg w-120 h-fit " onClick={(e) => e.stopPropagation()}>
                <div className="text-lg font-bold text-myblue-800 mb-2">更新旅程</div>
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
                    <button className="mt-4 px-4 py-2 text-base-400 text-myblue-600 rounded-full hover:bg-myzinc-200" onClick={() => { setIsEditingTrip(false) }}>
                        取消
                    </button>
                    <button className="mt-4 px-4 py-2  text-myblue-600 bg-primary-300 text-base-500 rounded-full hover:text-primary-300 hover:bg-myblue-700"
                        onClick={() => { if (!userId || !tripId || !trip) return; updateTrip(userId, tripId, trip) }}>
                        更新
                    </button>
                </div>
            </div>
        </div>
    )
}

