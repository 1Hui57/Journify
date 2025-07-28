'use client'

import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, increment, limit, onSnapshot, orderBy, query, Timestamp, updateDoc, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useParams, useRouter } from 'next/navigation';

import { useUserData } from "@/context/UserDataContext";
import { auth, db } from "@/lib/firebase";
import { PublicTrip } from "@/app/type/trip";
import HomeTripCard from "@/component/HomeTripCard";
import { useAuth } from "@/context/AuthContext";

interface UserData {
    email: string;
    memberPhotoUrl: string;
    createdAt: Timestamp;
    likeTrips: string[] | null;
    saveTrips: string[] | null;
    nickName: string | undefined;
}


export default function UserPage() {

    const router = useRouter();

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 取得該使用者ID
    const params = useParams();
    const pageUserId = typeof params.userId === "string" ? params.userId : params.userId?.[0];

    // 該使用者建立的公開旅程
    const [trips, setTrips] = useState<PublicTrip[]>([]);

    // 取得Context的user資料
    const { addUserId, userDataMap } = useUserData();

    // 每頁的旅程
    const [saveTripsPages, setSaveTripsPages] = useState<{ page: number; trips: PublicTrip[] }[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const tripsPerPage = 4;
    const totalPages = Math.ceil(trips.length / tripsPerPage);

    // 該使用者資料
    const [userData, setUserData] = useState<UserData | undefined>(undefined);

    // 使用者按愛心與收藏的旅程
    const [likeTrips, setLikeTrips] = useState<string[]>([]);
    const [saveTrips, setSaveTrips] = useState<string[]>([]);


    // 跳出請先登入彈窗
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [hideAnimation, setHideAnimation] = useState(false);
    const founderId: string = process.env.NEXT_PUBLIC_FOUNDER_ID ?? '';

    // 預設隨機照片
    const defaultCoverPhotos = [
        "/default1.jpg",
        "/default2.jpg",
        "/default3.jpg",
        "/default4.jpg",
        "/default5.jpg",
        "/default6.jpg",
        "/default7.jpg"
    ];


    useEffect(() => {
        if (pageUserId) {
            addUserId(pageUserId);
        }
    }, [pageUserId]);

    useEffect(() => {
        if (!pageUserId) return;

        const pageUserData = userDataMap.get(pageUserId);
        if (pageUserData) {
            setUserData(pageUserData);
        }
    }, [userDataMap, pageUserId]);



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
                if (data.likeTrips && data.saveTrips) {
                    setLikeTrips(data.likeTrips);
                    setSaveTrips(data.saveTrips);
                }
            } else {
                setLikeTrips([]);
                setSaveTrips([]);
            }
        }
        fetchUserData(userId);

    }, [userId, isUserSignIn]);

    // 取得該頁面使用者資料庫的資料
    useEffect(() => {

        if (!pageUserId) return;

        const fetchPublicTrips = async () => {
            try {
                const q = query(
                    collection(db, "all_trips"),
                    where("isPublic", "==", true),
                    where("userId", "==", pageUserId),
                    orderBy("likeCount", "desc"),
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

                setTrips(data);
            } catch (e) {
                console.error("載入旅程失敗", e);
            }
        }

        fetchPublicTrips();

    }, [pageUserId]);

    // 載入currentPage
    useEffect(() => {
        if (!pageUserId || trips.length === 0) return;

        const totalPages = Math.ceil(trips.length / tripsPerPage);
        const pagesData = [];

        for (let i = 0; i < totalPages; i++) {
            const startIdx = i * tripsPerPage;
            const endIdx = startIdx + tripsPerPage;
            const pageTrips = trips.slice(startIdx, endIdx);

            pagesData.push({
                page: i + 1,
                trips: pageTrips
            });
        }

        setSaveTripsPages(pagesData);
    }, [pageUserId, trips])

    // 隨機照片
    function getRandomCoverPhoto(): string {
        return defaultCoverPhotos[Math.floor(Math.random() * defaultCoverPhotos.length)];
    }

    const currentTrips = saveTripsPages.find(p => p.page === currentPage)?.trips || [];

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

        // 👉 如果是要加入收藏，但數量已經滿了，就不處理
        if (!isSave && saveTrips.length >= 12) {
            alert("最多只能收藏 12 筆旅程！");
            return;
        }

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


    return (
        <div className="w-full h-full">
            {showAlert &&
                <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 w-72 h-16 px-6 bg-mywhite-100 rounded-lg shadow-2xl z-50 flex justify-center items-center
                    animate-[slideDownFadeIn_0.3s_ease-out] ${hideAnimation ? "animate-[slideUpFadeOut_0.5s_ease-in]" : ""}`}>
                    <p className=" text-primary-600">請先登入！</p>
                </div>
            }
            <div className="relative w-full h-60" style={{ backgroundImage: `url('/member-background.jpg')`, }}>
                <div className="absolute w-30 h-30 bottom-[-55px] left-1/2 transform -translate-x-1/2  rounded-full bg-amber-100 overflow-hidden">
                    <img src={userData?.memberPhotoUrl} className="w-full h-full object-cover" />
                </div>
            </div>
            <div id="userData" className="w-fit h-fit m-auto mt-18 text-myzinc-700 text-center flex flex-col gap-1">
                <div className="flex justify-center items-center">
                    <p className="text-md font-500 text-myzinc-500">暱稱  <span className="text-myzinc-700">{userData?.nickName ? userData.nickName : "未設定"}</span></p>
                </div>
                <p className="text-myzinc-500">ID <span className="text-myzinc-700">{pageUserId}</span></p>
            </div>
            <div className="w-full h-fit m-auto flex flex-col items-center mt-2">
                <div className="text-lg-700 text-primary-600 border-b-2 border-primary-600">旅程</div>
                <div id="tripWrapper" className="w-[80%] max-w-[1000px] mx-auto mt-5 mb-5 px-2 grid grid-cols-1 sm:grid-cols-2 gap-5 place-items-center">
                    {currentTrips && currentTrips.map((item) => (<HomeTripCard key={item.tripId} item={item} likeTrips={likeTrips} saveTrips={saveTrips}
                        toggleLike={toggleLike} toggleSave={toggleSave} showLoginAlert={showLoginAlert} isUserSignIn={isUserSignIn} founderId={founderId}/>))}
                </div>
            </div>
            <div className="flex justify-center mt-2 mb-4 gap-2">
                {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`px-3 py-1 rounded ${currentPage === i + 1 ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>

    )
}