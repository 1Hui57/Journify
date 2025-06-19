'use client'

import { Country, PublicTrip } from "@/app/type/trip";
import HomeTripCard from "@/component/HomeTripCard";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { query, collection, where, orderBy, limit, getDocs, getDoc, Timestamp, doc, arrayRemove, arrayUnion, updateDoc, increment } from "firebase/firestore";
import { useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react";
import { FiArrowDown } from "react-icons/fi"; //向下箭頭
import { FiArrowUp } from "react-icons/fi"; //向上箭頭

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

    // 熱門排序或時間排序
    const [arrow, setArrow] = useState<"DOWN" | "UP">("DOWN");
    const [sorting, setSorting] = useState<"POPULAR" | "TIME">("POPULAR");

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

    // 預設隨機照片
    const defaultCoverPhotos = [
        "/default1.jpg",
        "/default2.jpg",
        "/default3.jpg",
        "/default4.jpg",
    ];

    // 載入國家資料
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error("載入國家失敗", error));
    }, []);

    // 取得使用者資料庫中按愛心與收藏的旅程資料
    useEffect(() => {

        if (!user || !userId) {
            setLikeTrips([]);
            setSaveTrips([]);
            return;
        }

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

    }, [userId, isUserSignIn]);

    // 讀取該國公開的旅程
    useEffect(() => {

        const fetchPublicTrips = async () => {
            try {
                const q = query(
                    collection(db, "all_trips"),
                    where("isPublic", "==", true),
                    where("countryCodes", "array-contains", countryCode),
                    orderBy(sorting === "POPULAR" ? "likeCount" : "updateAt", "desc"),
                    limit(12)
                );

                const snapshot = await getDocs(q);
                const data: PublicTrip[] = snapshot.docs.map((doc) => {
                    const tripData = doc.data() as PublicTrip;
                    const tripPhotoUrl = tripData.tripPhotoUrl ? tripData.tripPhotoUrl : getRandomCoverPhoto();
                    return {
                        ...tripData,
                        tripPhotoUrl
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

    // 計算目前排序方式的公開旅程
    const sortedTrips = useMemo(() => {
        if (!publicTrips) return [];

        const tripsCopy = [...publicTrips];

        tripsCopy.sort((a, b) => {
            if (sorting === "POPULAR") {
                // 根據愛心數排序
                return arrow === "DOWN"
                    ? (b.likeCount ?? 0) - (a.likeCount ?? 0)  // 大到小
                    : (a.likeCount ?? 0) - (b.likeCount ?? 0); // 小到大
            } else {
                // 根據時間排序
                const timeA = a.updateAt?.toMillis?.() ?? 0;
                const timeB = b.updateAt?.toMillis?.() ?? 0;
                return arrow === "DOWN"
                    ? timeB - timeA  // 新 → 舊
                    : timeA - timeB; // 舊 → 新
            }
        });

        return tripsCopy;
    }, [publicTrips, sorting, arrow]);

    // 切換使否按愛心
    const toggleLike = async (tripId: string) => {
        if (!userId) {
            return;
        };

        const userRef = doc(db, "users", userId);
        const publicRef = doc(db, "all_trips", tripId);
        const isLiked = likeTrips.includes(tripId);

        try {
            // 更新本地 state，立即反應 UI
            setLikeTrips((prev) =>
                isLiked ? prev.filter((id) => id !== tripId) : [...prev, tripId]
            );

            await updateDoc(userRef, {
                likeTrips: isLiked ? arrayRemove(tripId) : arrayUnion(tripId)
            });

            await updateDoc(publicRef, {
                likeCount: increment(isLiked ? -1 : 1)
            })


        } catch (e) {
            console.error("更新愛心失敗", e);
        }
    };

    // 切換使否收藏
    const toggleSave = async (tripId: string) => {
        if (!userId) {
            return;
        };

        const userRef = doc(db, "users", userId);
        const isSave = saveTrips.includes(tripId);

        try {
            // 更新本地 state，立即反應 UI
            setSaveTrips((prev) =>
                isSave ? prev.filter((id) => id !== tripId) : [...prev, tripId]
            );

            await updateDoc(userRef, {
                saveTrips: isSave ? arrayRemove(tripId) : arrayUnion(tripId),
            });


        } catch (e) {
            console.error("更新收藏失敗", e);
        }
    };
    // 切換排序方式
    const toggleSorting = () => {
        if (sorting === "POPULAR") {
            setSorting("TIME");
        } else {
            setSorting("POPULAR");
        }
    }

    // 切換排序箭頭上下
    const toggleArrow = () => {
        if (arrow === "DOWN") {
            setArrow("UP");
        } else {
            setArrow("DOWN");
        }
    }

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

    // 隨機照片
    function getRandomCoverPhoto(): string {
        return defaultCoverPhotos[Math.floor(Math.random() * defaultCoverPhotos.length)];
    }

    const countryName = countries.find(item => item.countryCode === countryCode)?.countryName;
    const countryPhotoUrl = countries.find(item => item.countryCode === countryCode)?.photoURL;

    return (
        <div className="w-full h-full">
            {isLoading &&
                <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <p className="text-mywhite-100">旅雀加載中...請稍後</p>
                </div>
            }
            {showAlert &&
                <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 w-72 h-16 px-6 bg-mywhite-100 rounded-lg shadow-2xl z-50 flex justify-center items-center
                    animate-[slideDownFadeIn_0.3s_ease-out] ${hideAnimation ? "animate-[slideUpFadeOut_0.5s_ease-in]" : ""}`}>
                    <p className=" text-primary-600">請先登入！</p>
                </div>
            }
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
                        <p onClick={() => { toggleSorting() }} className="w-20 text-md font-400 text-zinc-400 text-right">{sorting === "POPULAR" ? "熱門旅程" : "最新旅程"}</p>
                        {arrow === "DOWN" ?
                            <FiArrowDown onClick={() => { toggleArrow() }} className="w-6 h-6 text-zinc-400" />
                            : <FiArrowUp onClick={() => { toggleArrow() }} className="w-6 h-6 text-zinc-400" />
                        }

                    </button>
                </div>
                <div id="tripWrapper" className="w-full mt-5 mb-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 px-2 ">
                    {sortedTrips && sortedTrips.map((item) => (<HomeTripCard key={item.tripId} item={item} likeTrips={likeTrips} saveTrips={saveTrips}
                        toggleLike={toggleLike} toggleSave={toggleSave} showLoginAlert={showLoginAlert} isUserSignIn={isUserSignIn} />))}
                </div>
            </div>
        </div>

    )
}