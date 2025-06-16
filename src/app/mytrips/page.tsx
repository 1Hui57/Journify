
'use client'
import TripPageCard from "@/component/TripPageCard";
import { SetStateAction, useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { IoMdAdd } from "react-icons/io";
import "react-day-picker/style.css";
import { auth } from '@/lib/firebase';
import { addDoc, collection, query, onSnapshot, doc, deleteDoc, updateDoc, getDoc, increment, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from '@/context/AuthContext';
import { Timestamp } from "firebase/firestore";
import CreateTrip from "@/component/CreateTrip";
import UpdateTrip from "@/component/UpdateTrip";
import { Country, TripDaySchedule } from "../type/trip";


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

export default function MyTrips() {

    const router = useRouter();
    const [isLoading, setIsloading] = useState<boolean>(true);

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 建立旅程狀態
    const [isAddTrip, setIsAddTrip] = useState<boolean>(false);

    // 更新旅程狀態
    const [isEditingTrip, setIsEditingTrip] = useState<boolean>(false);
    const [editTripData, setEditTripData] = useState<Trip | null>(null);

    // 使用者資料庫的旅程資料
    const [trips, setTrips] = useState<Trip[]>([]);

    // 儲存旅程資料
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    // 使用者是否為登入狀態
    useEffect(() => {
        if (!isUserSignIn && !loading) {
            router.push("/login")
        }
    }, [isUserSignIn, loading])

    // 取得使用者資料庫的旅程資料
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, "users", user.uid, "trips")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Trip[] = snapshot.docs.map((doc) => {
                const tripData = doc.data() as Trip;
                // const tripTime = {
                //     tripFrom: tripData.tripTime.tripFrom.toDate(),
                //     tripTo: tripData.tripTime.tripTo.toDate(),
                // };
                return {
                    id: doc.id,
                    tripName: tripData.tripName,
                    person: tripData.person,
                    tripTime: tripData.tripTime,
                    isPublic: tripData.isPublic,
                    tripCountry: tripData.tripCountry,
                    createAt: tripData.createAt,
                    updateAt: tripData.updateAt,
                };
            });
            setTrips(data);
            setIsloading(false);
            console.log(data);
        });
        return () => unsubscribe();
    }, [user?.uid]);

    // 刪除旅程
    async function deleteTrip(userId: string | undefined, tripId: string) {
        if (userId && tripId) {
            const tripCountries = trips.find(item => item.id === tripId)?.tripCountry;
            if (!tripCountries) return;
            try {
                const tripRef = doc(db, "users", userId, "trips", tripId);
                const allTripRef = doc(db, "all_trips", tripId);
                await deleteDoc(tripRef);
                await deleteDoc(allTripRef);
                updateCountryStatsOnDelete(tripCountries);
                console.log("Trip deleted successfully");
            } catch (error) {
                console.error("Failed to delete trip:", error);
            }
        }
        return
    }

    // 變更個人旅程隱私權限，公開同時將旅程寫入公開旅程資料表
    async function updateTripPrivate(userId: string, tripId: string, isPublic: boolean) {
        try {
            const tripsRef = doc(db, "users", userId, "trips", tripId);
            const publicRef = doc(db, "all_trips", tripId)
            await updateDoc(tripsRef, {
                isPublic: !isPublic
            });
            await updateDoc(publicRef, {
                isPublic: !isPublic
            });
            console.log("旅程的公開狀態已更新");
        }

        catch (error) {
            console.error("更新旅程公開狀態失敗:", error);
            alert("新增資料時發生錯誤，請稍後再試！");
        }
    }

    /**
    * 建立旅程時，旅遊國家的統計資料表內該國家數字+1
    * @param {Country[]} tripCountry - 要建立的國家list
    */
    async function updateCountryStatsOnCreate(tripCountry: Country[]) {
        const promises = tripCountry.map(async (country) => {
            const countryRef = doc(db, "countryStats", country.countryCode);
            const countrySnap = await getDoc(countryRef);

            if (countrySnap.exists()) {
                // 已存在，count +1
                await updateDoc(countryRef, {
                    count: increment(1)
                });
            } else {
                // 不存在，新增該國家統計資料
                await setDoc(countryRef, {
                    code: country.countryCode,
                    name: country.countryName,
                    count: 1
                });
            }
        });

        await Promise.all(promises);
    }

    /**
    * 刪除旅程時，旅遊國家的統計資料表內該國家數字-1
    * @param {Country[]} tripCountry - 要建立的國家list
    */
    async function updateCountryStatsOnDelete(tripCountry: Country[]) {
        const promises = tripCountry.map(async (country) => {
            const countryRef = doc(db, "countryStats", country.countryCode);
            const countrySnap = await getDoc(countryRef);

            if (countrySnap.exists()) {
                const currentCount = countrySnap.data().count || 0;

                if (currentCount > 1) {
                    //  不是最後一筆，直接扣 1
                    await updateDoc(countryRef, {
                        count: increment(-1)
                    });
                } else {
                    //  如果是最後一筆就直接刪掉這筆統計
                    await setDoc(countryRef, {
                        code: country.countryCode,
                        name: country.countryName,
                        count: 0
                    });
                }
            }
        });

        await Promise.all(promises);
    }

    /**
    * 更新旅程時，旅遊國家的統計資料表內，移除的國家數字-1，新增的國家數字+1
    * @param {Country[]} oldCountries - 舊的國家list
    * @param {Country[]} newCountries - 更新的國家list
    */
    async function updateCountryStatsOnEdit(
        oldCountries: Country[],
        newCountries: Country[]
    ) {
        const oldSet = new Set(oldCountries.map(c => c.countryCode));
        const newSet = new Set(newCountries.map(c => c.countryCode));

        const toAdd = newCountries.filter(c => !oldSet.has(c.countryCode));
        const toRemove = oldCountries.filter(c => !newSet.has(c.countryCode));

        await updateCountryStatsOnCreate(toAdd);   // 新增的加一
        await updateCountryStatsOnDelete(toRemove); // 移除的減一
    }


    return (
        <div className="w-full h-full ">
            {isLoading &&
                <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <p className="text-mywhite-100">旅雀加載中...請稍後</p>
                </div>
            }
            {saveStatus !== "idle" && (
                <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <div className='w-fit h-fit px-5 py-3  text-mywhite-100 text-base-500'>
                        {saveStatus === "saving" && <span >儲存中...</span>}
                        {saveStatus === "success" && <span >儲存成功！</span>}
                        {saveStatus === "error" && <span >儲存失敗，請稍後再試</span>}
                    </div>
                </div>)}

            <div className="w-full h-fit flex flex-col p-10 mb-20">
                <div className="w-fit h-fit mb-6">
                    <p className="text-2xl font-bold text-myblue-800">我的旅程</p>
                </div>
                <div id="tripsWrapper" className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full lg:grid-cols-4">
                    {/* trip card */}
                    {trips.map((item) => (<TripPageCard key={item.id} item={item} tripPerson={item.person} deleteTrip={deleteTrip} userId={userId} updateTripPrivate={updateTripPrivate}
                        setIsEditingTrip={setIsEditingTrip} setEditTripData={setEditTripData} />))}
                </div>
                <button className="fixed bottom-6 right-10 w-30 h-10 bg-primary-300 ml-auto 
                rounded-full text-base text-myblue-600 font-bold flex items-center 
                justify-center gap-1 transition-transform duration-200 hover:bg-myblue-700
                 hover:text-primary-300" onClick={() => setIsAddTrip(true)}>
                    <IoMdAdd />
                    建立旅程
                </button>
            </div>
            {isAddTrip && <CreateTrip userId={userId} setIsAddTrip={setIsAddTrip} updateCountryStatsOnCreate={updateCountryStatsOnCreate} />}
            {isEditingTrip && <UpdateTrip userId={userId} setIsEditingTrip={setIsEditingTrip} editTripData={editTripData} setSaveStatus={setSaveStatus} updateCountryStatsOnEdit={updateCountryStatsOnEdit} />}
        </div>
    )
}
