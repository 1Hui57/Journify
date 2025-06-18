'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Timestamp } from 'firebase/firestore';
import { IoSearchSharp } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { v4 as uuidv4 } from 'uuid';
import { Country, Place, SelectTripDay, Trip, TripDaySchedule, TripScheduleItem } from '@/app/type/trip';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedAttractionId } from '@/store/sharingSlice';
import { timeStamp } from 'console';
import { SharingRootState } from '@/store/sharingStore';

interface SharingMapProps {
    trip: Trip | undefined;
    countryData: Country[] | undefined;
    selectedPlace: Place | null;
    selectedDay: SelectTripDay;
    tripDaySchedule: TripDaySchedule[];
    isPhotoLoading: boolean;
    setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;
    setShowTimePop: React.Dispatch<React.SetStateAction<boolean>>;
    setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
    setIsPhotoLoading: React.Dispatch<React.SetStateAction<boolean>>;
    setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
}
const containerStyle = { width: '100%', height: '100%' };
const libraries: ("places")[] = ["places"];

export default function SharingMapComponent({ countryData, selectedPlace, setSelectedPlace, selectedDay,
    setShowTimePop, tripDaySchedule, setTripDaySchedule, setIsPhotoLoading, trip, setTrip, isPhotoLoading }: SharingMapProps) {

    if (!countryData) return null;

    // redux 使用Dispatch
    const dispatch = useDispatch();

    const [activeCountry, setActiveCountry] = useState<Country>(countryData[0]);

    // 取得此行程countryData
    const defaultCenter = activeCountry
        ? { lat: countryData[0].lat, lng: countryData[0].lng }
        : { lat: 25.033964, lng: 121.564468 }; // 台北101

    // 初始化載入google map
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
        language: 'zh-TW',
    });

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const mapRef = useRef<google.maps.Map | null>(null);

    const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

    // 顯示路線
    const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
    const [currentDay, setCurrentDay] = useState<TripDaySchedule | undefined>(undefined);


    // 取得Redux目前點擊的Card的place_id
    const selectedAttractionId = useSelector((state: SharingRootState) => state.sharing.selectedAttractionId);

    // 依目前範圍搜尋並在顯示相關景點
    const [searchResults, setSearchResults] = useState<google.maps.places.PlaceResult[] | null>(null);

    useEffect(() => {
        if (!tripDaySchedule) return;
        setCurrentDay(tripDaySchedule.find((item) => item.id === selectedDay.id));
    }, [selectedDay, tripDaySchedule])

    // 檢查圖片是否過期
    const isPhotoExpired = (timeStamp: Timestamp) => {
        const now = Date.now(); // 當前時間的毫秒數 (number)
        const twoDays = 2 * 24 * 60 * 60 * 1000; // 兩天的毫秒數

        // 將 Timestamp 轉換為毫秒數
        const timestampInMs = timeStamp.toMillis();

        return now - timestampInMs > twoDays;
    };

    useEffect(() => {
        if (!isLoaded || placesServiceRef.current) return;

        const dummyDiv = document.createElement('div');
        placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);
    }, [isLoaded]);

    useEffect(() => {
        // 等到 trip 有值，才開始檢查是否需要跑圖片更新
        if (!isLoaded || !trip || !placesServiceRef.current) return;
        if (!isPhotoLoading) return;

        const updatePhotos = async () => {
            console.log("開始更新圖片");
            // 處理每一天的行程
            const tripDaySchedule = trip?.tripDaySchedule;
            if (!tripDaySchedule) return; // 再次防呆
            const updatedTripDaySchedule = await Promise.all(
                tripDaySchedule.map(async (day) => {
                    const updatedAttractions = await Promise.all(
                        day.attractionData.map(async (item) => {
                            const shouldUpdate = !item.timeStamp || isPhotoExpired(item.timeStamp);
                            if (!shouldUpdate) return item;

                            // 非同步取得圖片
                            return new Promise<TripScheduleItem>((resolve) => {
                                placesServiceRef.current!.getDetails(
                                    {
                                        placeId: item.place_id,
                                        fields: ['photos'],
                                    },
                                    (result, status) => {
                                        if (
                                            status === google.maps.places.PlacesServiceStatus.OK &&
                                            result?.photos?.length
                                        ) {
                                            const updated = {
                                                ...item,
                                                photo: result.photos[0].getUrl({ maxWidth: 500 }),
                                                timeStamp: Timestamp.now(), // Firestore timestamp
                                            };
                                            resolve(updated);
                                        } else {
                                            resolve(item); // 保留原本資料
                                        }
                                    }
                                );
                            });
                        })
                    );

                    return {
                        ...day,
                        attractionData: updatedAttractions,
                    };
                })
            );

            // 更新 trip 內容
            setTrip((prev) => ({
                ...prev!,
                tripDaySchedule: updatedTripDaySchedule,
            }));
            setIsPhotoLoading(false);//圖片更新完成
            console.log("圖片更新完成");
        };

        updatePhotos();
    }, [isLoaded, trip, placesServiceRef.current, isPhotoLoading]);




    

    // 縣市目前選擇天數的行程路線渲染
    useEffect(() => {
        if (!isLoaded) return; // 新增這行
        if (!tripDaySchedule || tripDaySchedule.length < 2 || !selectedDay.id) return;

        const currentDay = tripDaySchedule.find(item => item.id === selectedDay.id);
        if (!currentDay || currentDay.attractionData.length < 2) {
            setDirectionsResult(null);
            return;
        }

        const directionsService = new google.maps.DirectionsService();

        const origin = {
            lat: currentDay.attractionData[0].lat,
            lng: currentDay.attractionData[0].lng,
        };

        const destination = {
            lat: currentDay.attractionData[currentDay.attractionData.length - 1].lat,
            lng: currentDay.attractionData[currentDay.attractionData.length - 1].lng,
        };

        const waypoints = currentDay.attractionData.slice(1, -1).map((attraction) => ({
            location: { lat: attraction.lat, lng: attraction.lng },
            stopover: true,
        }));

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.WALKING, // 可改 WALKING、TRANSIT、DRIVING
                optimizeWaypoints: false, // 是否最佳化路線
            },
            (result, status) => {
                if (status === "OK" && result) {
                    setDirectionsResult(result);
                } else if (status === "ZERO_RESULTS") {
                    console.warn("無法取得路線（ZERO_RESULTS）：這兩點之間可能沒有可行的路線。");
                    setDirectionsResult(null); // 可選：清空既有結果
                } else {
                    console.error("Failed to fetch directions:", status);
                }
            }
        );
    }, [tripDaySchedule, selectedDay]);

   
    // 取得Card現在點擊的place_id並在地圖顯示地點及資訊小卡
    useEffect(() => {
        if (!placesServiceRef.current || !selectedAttractionId) return;

        placesServiceRef.current.getDetails(
            {
                placeId: selectedAttractionId,
                fields: ['name', 'formatted_address', 'geometry', 'rating', 'opening_hours', 'photos'],
            },
            (place, status) => {
                if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    };
                    setSelectedPlace({
                        id: uuidv4(), // 產生一個唯一的 ID
                        place_id: selectedAttractionId,
                        name: place.name,
                        address: place.formatted_address,
                        location,
                        rating: place.rating,
                        photos: place.photos?.[0]?.getUrl({ maxWidth: 500 }),
                        opening_hours: place.opening_hours,
                    });
                    setMapCenter(location); // 將地圖中心移到選定的景點
                } else {
                    console.error("無法獲取景點詳細資訊:", status);
                }
            }
        );
    }, [selectedAttractionId])

    // 關閉景點資訊卡
    function closeAttractionData() {
        console.log(selectedPlace);
        setSelectedPlace(null);
        dispatch(setSelectedAttractionId(null));
        return;
    }

    

    // 點擊渲染的圖標顯示資訊小卡
    const clickKeywordSearchResult = (place_id: string) => {
        placesServiceRef.current?.getDetails(
            {
                placeId: place_id,
                fields: ['name', 'formatted_address', 'geometry', 'rating', 'opening_hours', 'photos'],
            },
            (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
                    const location = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                    };
                    const id = uuidv4();
                    setSelectedPlace({
                        id: id,
                        place_id: place_id,
                        name: place.name,
                        address: place.formatted_address,
                        location,
                        rating: place.rating,
                        photos: place.photos?.[0]?.getUrl({ maxWidth: 500 }),
                        opening_hours: place.opening_hours,
                    });
                }
            }
        );
    }

    // 更新地圖中心點
    const mapHandleIdle = () => {
        if (mapRef.current) {
            const center = mapRef.current.getCenter();
            if (center) {
                const lat = center.lat();
                const lng = center.lng();
                setMapCenter({ lat, lng });
            }
        }
    };



    if (loadError) return <div>地圖載入錯誤</div>;
    if (!isLoaded) return <div>地圖載入中...</div>;

    return (
        <div className='relative w-full h-full'>
            {/* 地點資訊卡（點選後才出現） */}
            {selectedPlace && (
                <div
                    className='absolute bottom-3 left-3 w-60 md:w-80 h-fit flex flex-col bg-mywhite-100 rounded-[8px] z-10 shadow-[0_2px_6px_rgba(0,0,0,0.1)]'
                >
                    <div className='relative w-full h-full'>
                        <div className='absolute w-fit h-fit right-2 top-2 z-20 rounded-full bg-mywhite-50'>
                            <RxCross2
                                onClick={closeAttractionData}
                                className=' w-6 h-6 cursor-pointer'
                            />
                        </div>
                        {selectedPlace?.photos && selectedPlace.photos.length > 0 && selectedPlace.photos[0] && (
                            <div className='relative w-full h-20 md:h-40 rounded-t-[8px] overflow-hidden'>

                                <img
                                    src={selectedPlace.photos ? selectedPlace.photos : "/noPicture.png"}
                                    alt="/noPicture.png"
                                    className='w-full h-full object-cover'
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}
                        <div className='p-2 md:p-3'>
                            <div className='w-full h-fit text-lg-700 break-words'>{selectedPlace.name}</div>
                            <div className='w-full h-fit md:mb-2 text-sm-400 md:text-base-400 break-words'>{selectedPlace.address}</div>
                            {selectedPlace.rating && <div className='w-full h-fit mb-1 text-sm-400 md:text-base-400  break-words'>⭐ 評分：{selectedPlace.rating}</div>}
                            {selectedPlace.opening_hours?.weekday_text && selectedPlace.opening_hours?.weekday_text?.length > 0 && (
                                <div className='w-full'>
                                    <div className='mb-1'>
                                        <p className='text-sm-400 md:text-base-400'>🕒 營業時間：</p>
                                    </div>
                                    <ul className='pl-6 h-10 md:h-30 m-0 overflow-y-scroll'>
                                        {selectedPlace.opening_hours.weekday_text.map((text: string, idx: number) => (
                                            <li key={idx} className='text-sm mb-1'>{text}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            )}
            {/* 地圖本體 */}
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={14}
                // onLoad={handleMapLoad}
                onIdle={mapHandleIdle}
                options={{
                    mapTypeControl: false,
                    fullscreenControl: false,
                    streetViewControl: false,
                }}
            >
                {selectedPlace && <Marker position={selectedPlace.location} />}
                {searchResults && searchResults.map((place, index) => (
                    <Marker
                        key={place.place_id || index}
                        position={{
                            lat: place.geometry?.location?.lat() || 0,
                            lng: place.geometry?.location?.lng() || 0,
                        }}
                        onClick={() => { place.place_id && clickKeywordSearchResult(place.place_id) }}
                    />
                ))}
                {directionsResult && (
                    <DirectionsRenderer
                        directions={directionsResult}
                        options={{ suppressMarkers: true }} // 如果你有自訂 marker
                    />
                )}
                {currentDay?.attractionData.map((attraction, index) => (
                    <Marker
                        onClick={() => { clickKeywordSearchResult(attraction.place_id) }}
                        key={attraction.id || index}
                        position={{ lat: attraction.lat, lng: attraction.lng }}
                        label={{
                            text: `${index + 1}`,
                            color: '#884924',
                            fontSize: '14px',
                            fontWeight: 'bold',
                        }} // 可以顯示編號 1, 2, 3...
                        icon={{
                            url: '/placeholder.png', // 這裡放你的 png 路徑，可以是相對或 CDN 絕對路徑
                            scaledSize: new google.maps.Size(32, 32), // 根據圖片大小調整
                            labelOrigin: new google.maps.Point(16, 12), // 調整 label 顯示在圖案正中央
                        }}
                    />
                ))}
            </GoogleMap>
        </div>
    );
}