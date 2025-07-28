'use client'

import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { query, collection, onSnapshot, Timestamp, doc, updateDoc, getDocs, limit, orderBy, where, arrayRemove, arrayUnion, increment, documentId } from "firebase/firestore";
import { useEffect, useState } from "react";
import { PublicTrip, Trip } from "../type/trip";
import { useRouter } from 'next/navigation';
import { IoIosCamera } from "react-icons/io";
import UploadMemberPhoto from "@/component/UploadMemberPhoto";
import { MdEdit } from "react-icons/md";
import HomeTripCard from "@/component/HomeTripCard";

interface User {
    email: string;
    memberPhotoUrl: string;
    createdAt: Timestamp;
    likeTrips: string[] | null;
    saveTrips: string[] | null;
    nickName: string | undefined;
}
export default function MemberPage() {

    const router = useRouter();

    // useContext取得使用者登入狀態
    const { isUserSignIn, loading } = useAuth();
    const user = auth.currentUser;
    const userId = user?.uid;

    // 使用者資料
    const [userData, setUserData] = useState<User | null>(null);

    // 上傳圖片狀態
    const [isUploadPhoto, setTsUploadPhoto] = useState<boolean>(false);

    // 自訂使用者暱稱
    const [isEditingNickName, setIsEditingNickName] = useState<boolean>(false);
    const [userNickName, setUserNickName] = useState<string | null>(null);

    // 更新暱稱狀態
    const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

    // 收藏與愛心的旅程
    const [likeTrips, setLikeTrips] = useState<string[]>([]);
    const [saveTripsId, setSaveTripsId] = useState<string[]>([]);

    // 所有公開旅程的ID
    const [publicTripsId, setPublicTripsId] = useState<string[]>([]);

    // 每頁的旅程
    const [saveTripsPages, setSaveTripsPages] = useState<{ page: number; trips: PublicTrip[] }[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const tripsPerPage = 4;
    const totalPages = Math.ceil(saveTripsId.length / tripsPerPage);

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

    // 取得公開旅程ID
    useEffect(() => {
        const fetchPublicTripIds = async () => {
            try {
                const q = query(
                    collection(db, "all_trips"),
                    where("isPublic", "==", true),
                    orderBy("likeCount", "desc"),
                );

                const snapshot = await getDocs(q);
                const tripIds = snapshot.docs
                    .map(doc => doc.data().tripId)
                    .filter((id): id is string => typeof id === "string");

                // console.log("公開旅程 ID：", tripIds);
                setPublicTripsId(tripIds);
            } catch (e) {
                console.error("載入旅程 ID 失敗", e);
            }
        };

        fetchPublicTripIds();
    }, []);

    // 取得使用者資料庫的資料
    useEffect(() => {
        if (!user) {
            // router.push("/");
            return;
        }
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data() as User;
                setUserData(data);
                if (data.likeTrips && data.saveTrips) {
                    setSaveTripsId(data.saveTrips);
                    setLikeTrips(data.likeTrips);
                }
            } else {
                console.log("找不到使用者資料");
            }
        });

        return () => unsubscribe();
    }, [user?.uid]);

    // 過濾收藏但已經不存在的旅程
    useEffect(() => {
        if (publicTripsId.length === 0 || !userId) return;

        const filtered = saveTripsId.filter(id => publicTripsId.includes(id));

        // 如果有變化才更新
        if (filtered.length !== saveTripsId.length) {
            setSaveTripsId(filtered); // 更新本地狀態

            const userRef = doc(db, "users", userId);
            updateDoc(userRef, {
                saveTrips: filtered
            }).catch(err => {
                console.error("更新使用者 saveTrips 失敗", err);
            });
        }

    }, [publicTripsId])

    // 檢查當頁是否有資料
    useEffect(() => {
        const pageAlreadyLoaded = saveTripsPages.find(p => p.page === currentPage);
        if (pageAlreadyLoaded) return;

        const start = (currentPage - 1) * tripsPerPage;
        const end = start + tripsPerPage;
        const idsToFetch = saveTripsId.slice(start, end);

        if (idsToFetch.length === 0) return;

        fetchTripsByIds(idsToFetch, currentPage);
    }, [currentPage, saveTripsId]);

    const fetchTripsByIds = async (tripIds: string[], page: number) => {
        try {
            const q = query(
                collection(db, "all_trips"),
                where("tripId", "in", tripIds),
                where("isPublic", "==", true)
            );
            const snapshot = await getDocs(q);
            const trips = snapshot.docs.map(doc => {
                const data = doc.data() as PublicTrip;
                return {
                    ...data,
                    tripPhotoUrl: data.tripPhotoUrl || getRandomCoverPhoto(),
                };
            });

            setSaveTripsPages(prev => [...prev, { page, trips }]);
        } catch (err) {
            console.error("載入旅程失敗", err);
        }
    };
    const currentTrips = saveTripsPages.find(p => p.page === currentPage)?.trips || [];

    // 儲存使用者更新的暱稱
    const updateUserNickName = async (userId: string, userNickName: string) => {
        if (!userId) return;
        if (!userNickName) {
            alert("請輸入暱稱");
            return;
        }
        setSaveStatus("saving");
        try {
            await updateDoc(doc(db, "users", userId), {
                nickName: userNickName
            });
            // console.log("更新成功");
            setSaveStatus("success");
            // 1.5 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1000);
        } catch (err) {
            // console.error("更新失敗", err);
            setSaveStatus("error");
            // 2 秒後自動隱藏提示
            setTimeout(() => setSaveStatus("idle"), 1500);
        } finally {
            setIsEditingNickName(false);
            setUserNickName(null);
        }
    }

    // 隨機照片
    function getRandomCoverPhoto(): string {
        return defaultCoverPhotos[Math.floor(Math.random() * defaultCoverPhotos.length)];
    }

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
        const isSave = saveTripsId.includes(tripId);

        // 👉 如果是要加入收藏，但數量已經滿了，就不處理
        if (!isSave && saveTripsId.length >= 12) {
            alert("最多只能收藏 12 筆旅程！");
            return;
        }

        try {
            // 更新本地 state，立即反應 UI
            setSaveTripsId((prev) =>
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
            {saveStatus !== "idle" && (
                <div className='fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center'>
                    <img src="/loading.gif" className="w-30 h-30 " />
                    <div className='w-fit h-fit px-5 py-3  text-mywhite-100 text-base-500'>
                        {saveStatus === "saving" && <span >儲存中...</span>}
                        {saveStatus === "success" && <span >儲存成功！</span>}
                        {saveStatus === "error" && <span >儲存失敗，請稍後再試</span>}
                    </div>
                </div>)}
            <div className="relative w-full h-60" style={{ backgroundImage: `url('/member-background.jpg')`, }}>
                <div className="absolute w-30 h-30 bottom-[-55px] left-1/2 transform -translate-x-1/2  rounded-full bg-amber-100 overflow-hidden">
                    <img src={userData?.memberPhotoUrl} className="w-full h-full object-cover" />
                </div>
                <div className="absolute w-fit h-fit text-primary-600 bottom-[-63px] left-1/2 transform -translate-x-1/2 bg-mywhite-100 rounded-full shadow-lg cursor-pointer">
                    <IoIosCamera className="w-6 h-6" onClick={() => { setTsUploadPhoto(true) }} />
                </div>
            </div>
            <div id="userData" className="w-fit h-fit m-auto mt-18 text-myzinc-700 text-center flex flex-col gap-1">
                <div className="flex justify-center items-center">
                    {isEditingNickName ?
                        <div className="flex justify-center items-center gap-1">
                            <p className="text-md font-500 text-myzinc-500">暱稱</p>
                            <input type="text" onChange={(e) => { setUserNickName(e.target.value) }} className="border-1 border-myzinc-400" />
                            <button onClick={() => { setIsEditingNickName(false) }}
                                className="bg-myzinc-300 rounded-full px-2 py-1 hover:bg-myzinc-400 text-myblue-700 hover:text-mywhite-100 text-sm-400">取消</button>
                            <button onClick={() => { if (!userId || !userNickName) return; updateUserNickName(userId, userNickName) }}
                                className="bg-primary-300 rounded-full px-2 py-1 hover:bg-myblue-400 text-myblue-700 hover:text-primary-300 text-sm-400">儲存</button>
                        </div>
                        : <>
                            <p className="text-md font-500 text-myzinc-500">暱稱  <span className="text-myzinc-700">{userData?.nickName ? userData.nickName : "未設定"}</span></p>
                            <MdEdit onClick={() => { setIsEditingNickName(true) }} className="ml-2 cursor-pointer" />
                        </>
                    }
                </div>
                <p className="text-myzinc-500">ID <span className="text-myzinc-700">{userId}</span></p>
            </div>
            <div className="w-full h-fit m-auto flex flex-col items-center mt-2">
                <div className="text-lg-700 text-primary-600 border-b-2 border-primary-600">我的收藏</div>
                <div id="tripWrapper" className="w-[80%] max-w-[1000px] mx-auto mt-5 mb-5 px-2 grid grid-cols-1 sm:grid-cols-2 gap-5 place-items-center">
                    {currentTrips && currentTrips.map((item) => (<HomeTripCard key={item.tripId} item={item} likeTrips={likeTrips} saveTrips={saveTripsId}
                        toggleLike={toggleLike} toggleSave={toggleSave} showLoginAlert={showLoginAlert} isUserSignIn={isUserSignIn} founderId={founderId}/>))}
                </div>
            </div>
            <div className="flex justify-center mt-4 mb-4 gap-2">
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
            {isUploadPhoto && <UploadMemberPhoto userId={userId} setTsUploadPhoto={setTsUploadPhoto} />}
        </div>
    )
}