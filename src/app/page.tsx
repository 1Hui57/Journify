'use client'
import HotCounty from "@/component/HotCounty";
import "../style.css"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';
import SearchBar from "@/component/SearchBar";
import HomeTripCard from "@/component/HomeTripCard";
import { query, collection, onSnapshot, where, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import { DiVim } from "react-icons/di";

interface FirestoreTripTime {
    tripFrom: Timestamp;
    tripTo: Timestamp;
}

interface FirestoreTrip {
    userId: string
    tripId: string;
    tripName: string;
    person: number;
    tripTime: FirestoreTripTime;
    isPublic: boolean;
    tripCountry: string;
    createAt: Timestamp;
    updateAt: Timestamp;
}
export default function Home() {

    const router = useRouter();
    const [publicTrips, setPublicTrips] = useState<FirestoreTrip[]>();
    const [isLoading, setIsloading] = useState<boolean>(true);
    // 讀取公開的旅程並渲染
    useEffect(() => {
        const publicTripRef = query(
            collection(db, "all_trips"),
            where("isPublic", "==", true)
        );
        const unsubscribe = onSnapshot(publicTripRef, (snapshot) => {
            const data: FirestoreTrip[] = snapshot.docs.map((doc) => {
                const tripData = doc.data() as FirestoreTrip;
                return {
                    userId: tripData.userId,
                    tripId: tripData.tripId,
                    tripName: tripData.tripName,
                    person: tripData.person,
                    tripTime: tripData.tripTime,
                    isPublic: tripData.isPublic,
                    createAt: tripData.createAt,
                    updateAt:tripData.updateAt,
                    tripCountry: tripData.tripCountry
                };
            });
            setPublicTrips(data);
            setIsloading(false);
        });
        return () => unsubscribe();
    }, []);

    // 使用者按愛心

    return (
        <div className=' w-full h-full '>
            {isLoading &&
                <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <p className="text-mywhite-100">旅雀加載中...請稍後</p>
                </div>
            }
            <div className="w-full h-full max-w-6xl px-8 m-auto">
                <div className='w-full h-fit pt-8 mb-2 flex flex-col gap-5'>
                    <p className="w-full sm:text-2xl text-xl font-extrabold text-myblue-700 leading-relaxed">Journify幫你輕鬆安排行程</p>
                    <p className="text-zinc-500 sm:text-[20px] text-base-400 font-400">超過 38,512 人都在使用的排程網站</p>
                </div>

                <div className='w-full h-fit md:h-46 flex flex-col md:flex-row mt-5  mb-5 gap-5'>
                    <div className='bg-primary-300 h-42 w-full md:w-2/5 p-6 pl-8 rounded-4xl flex flex-col sm:h-full'>
                        <p className='text-myblue-700 text-xl-700'>開始規劃</p>
                        <p className='text-myblue-700 text-2xl-700'>你的旅程</p>
                        <button onClick={() => { router.push("/mytrips") }} className='text-primary-100 bg-myblue-600 w-20 h-10 self-end rounded-full font-bold md:mt-8 hover:bg-myblue-800'>START</button>
                    </div>
                    <div className='h-full w-full md:w-3/5 flex flex-col '>
                        <div className="w-full h-[70px] flex gap-5 pl-3 md:pl-0 mb-2 items-center">
                            <div className="w-1 h-[40px] bg-primary-400"></div>
                            <p className="w-full text-myblue-700 text-2xl-700">熱門國家</p>
                        </div>
                        <div id="hotCounty" className="w-full h-full flex gap-x-4 overflow-x-auto px-3 md:px-0 mb-3 md:mb-0">
                            { }
                            <HotCounty />
                            <HotCounty />
                            <HotCounty />
                            <HotCounty />
                        </div>
                    </div>
                </div>
                <SearchBar />
                <div className="w-full pl-3 flex gap-5 mt-6  items-center">
                    <div className="w-1 h-[40px] bg-primary-400"></div>
                    <p className="w-fit text-myblue-700 text-2xl-700">熱門旅程</p>
                    <button className="w-fit self-end mt-3 flex items-center gap-2 pr-2 ml-auto">
                        <p className="w-20 text-md font-400 text-zinc-400 text-right">熱門程度</p>
                        <img src="/down.png" className="w-4 h-4" />
                    </button>
                </div>
                <div id="tripWrapper" className="w-full mt-5 mb-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 px-2 ">
                    {publicTrips && publicTrips.map((item) => (<HomeTripCard key={item.tripId} item={item} />))}
                </div>
            </div>

        </div>
    )

}