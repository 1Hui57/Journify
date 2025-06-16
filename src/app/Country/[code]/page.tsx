'use client'

import { Country, PublicTrip } from "@/app/type/trip";
import HomeTripCard from "@/component/HomeTripCard";
import { db } from "@/lib/firebase";
import { query, collection, where, orderBy, limit, getDocs } from "firebase/firestore";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react";

export default function CountryPage() {

    // 取得國家代碼
    const params = useParams();
    const countryCode = typeof params.code === "string" ? params.code : params.code?.[0];

    // 公開行程
    const [publicTrips, setPublicTrips] = useState<PublicTrip[]>();

    // 資訊載入中
    const [isLoading, setIsloading] = useState<boolean>(true);

    const [countries, setCountries] = useState<Country[]>([]);

    // 載入國家資料
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error("載入國家失敗", error));
    }, []);

    useEffect(() => {

        const fetchPublicTrips = async () => {
            try {
                const q = query(
                    collection(db, "all_trips"),
                    where("isPublic", "==", true),
                    where("countryCodes", "array-contains", countryCode),
                    orderBy("updateAt", "desc"),
                    // limit(12)
                );

                const snapshot = await getDocs(q);
                const data: PublicTrip[] = snapshot.docs.map((doc) => {
                    const tripData = doc.data() as PublicTrip;
                    return {
                        ...tripData,
                    };
                });

                setPublicTrips(data);
            } catch (e) {
                console.error("載入旅程失敗", e);
            }
        };
        fetchPublicTrips();

        setIsloading(false);
    }, [countryCode]);

    const countryName = countries.find(item => item.countryCode === countryCode)?.countryName;
    const countryPhotoUrl = countries.find(item => item.countryCode === countryCode)?.photoURL;

    return (
        <div className="w-full h-full px-5">
            <div className="w-full h-100 flex mt-10 rounded-md overflow-hidden">
                <div className="w-[40%] h-full px-10 bg-black flex flex-col items-center justify-center">
                    <p className="w-fit  text-primary-200 text-4xl font-extrabold">旅遊國家。{countryName}</p>
                </div>
                <div className="w-[60%] h-100"
                    style={{
                        backgroundImage: `linear-gradient(to right, black 0%, rgba(0, 0, 0, 0.8) 20%, rgba(0,0,0,0) 50%), url('${countryPhotoUrl || "/hotCountry.jpg"}')`,
                        backgroundRepeat: "no-repeat",     // ✅ 不重複
                        backgroundSize: "cover",           // ✅ 填滿容器
                        backgroundPosition: "center"       // ✅ 圖片置中
                    }}>

                </div>
            </div>

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
    )
}