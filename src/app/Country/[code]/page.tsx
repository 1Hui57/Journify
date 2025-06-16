'use client'

import { Country, PublicTrip } from "@/app/type/trip";
import HomeTripCard from "@/component/HomeTripCard";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { query, collection, where, orderBy, limit, getDocs, getDoc, Timestamp, doc, arrayRemove, arrayUnion, updateDoc } from "firebase/firestore";
import { useParams } from "next/navigation"
import { useEffect, useState } from "react";

interface UserData {
    nickName: string;
    email: string;
    createAt: Timestamp;
    likeTrips: string[];
    saveTrips: string[];
}

export default function CountryPage() {

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 跳出請先登入彈窗
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [hideAnimation, setHideAnimation] = useState(false);

    // 取得國家代碼
    const params = useParams();
    const countryCode = typeof params.code === "string" ? params.code : params.code?.[0];

    // 公開行程
    const [publicTrips, setPublicTrips] = useState<PublicTrip[]>();

    // 資訊載入中
    const [isLoading, setIsloading] = useState<boolean>(true);
    const [countries, setCountries] = useState<Country[]>([]);

    // 使用者按愛心與收藏的旅程
    const [likeTrips, setLikeTrips] = useState<string[]>([]);
    const [saveTrips, setSaveTrips] = useState<string[]>([]);

    // 載入國家資料
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error("載入國家失敗", error));
    }, []);

    // 取得使用者資料庫中按愛心與收藏的旅程資料
    useEffect(() => {

        if (!user || !userId) return;

        async function fetchUserData(userId: string) {
            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
                const data = userDoc.data() as UserData;
                setLikeTrips(data.likeTrips);
                setSaveTrips(data.saveTrips);
            } else {
                setLikeTrips([]);
                setSaveTrips([]);
            }
        }
        fetchUserData(userId);

    }, [userId]);

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

    // 使用者按愛心與否
    const toggleLike = async (tripId: string) => {
        if (!userId) {
            return;
        };

        const userRef = doc(db, "users", userId);
        const isLiked = likeTrips.includes(tripId);

        try {
            await updateDoc(userRef, {
                likeTrips: isLiked ? arrayRemove(tripId) : arrayUnion(tripId),
            });

            // 更新本地 state，立即反應 UI
            setLikeTrips((prev) =>
                isLiked ? prev.filter((id) => id !== tripId) : [...prev, tripId]
            );
        } catch (e) {
            console.error("更新愛心失敗", e);
        }
    };

    // 跳出提醒彈出視窗1.5秒後隱藏
    const showLoginAlert = () => {
        setShowAlert(true);
        setHideAnimation(false);

        // 等 1.2 秒後啟動滑出動畫
        setTimeout(() => {
            setHideAnimation(true);
        }, 1200);

        // 再等 0.5 秒後隱藏整個彈窗
        setTimeout(() => {
            setShowAlert(false);
        }, 1700);
    };

    const countryName = countries.find(item => item.countryCode === countryCode)?.countryName;
    const countryPhotoUrl = countries.find(item => item.countryCode === countryCode)?.photoURL;

    return (
        <div className="w-full h-full max-w-6xl px-8 m-auto">
            <div className="w-full h-50 md:h-100 flex mt-10 rounded-md overflow-hidden">
                <div className="w-[50%] md:w-[40%] h-full  bg-black flex flex-col items-center justify-center">
                    <p className="w-fit  text-primary-200 text-lg md:text-4xl font-extrabold">旅遊國家。{countryName}</p>
                </div>
                <div className="w-[50%] md:w-[60%] h-full"
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
                {publicTrips && publicTrips.map((item) => (<HomeTripCard key={item.tripId} item={item} likeTrips={likeTrips} toggleLike={toggleLike} showLoginAlert={showLoginAlert} isUserSignIn={isUserSignIn} />))}
            </div>
        </div>
    )
}