'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Timestamp } from 'firebase/firestore';
import { IoSearchSharp } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { v4 as uuidv4 } from 'uuid';
import { Country, Place, SelectTripDay, Trip, TripDaySchedule, TripScheduleItem } from '@/app/type/trip';
import { useDispatch, useSelector } from 'react-redux';
import { TripEditRootState } from '@/store/tripEditStore';
import { setSelectedAttractionId } from '@/store/tripSlice';
import { useGoogleMaps } from '@/context/MapContext';

interface MapProps {
  trip: Trip | undefined;
  countryData: Country[] | undefined;
  selectedPlace: Place | null;
  selectedDay: SelectTripDay;
  tripDaySchedule: TripDaySchedule[];
  isPhotoLoading: boolean;
  setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;
  setPendingPlace: React.Dispatch<React.SetStateAction<TripScheduleItem | null>>;
  setShowTimePop: React.Dispatch<React.SetStateAction<boolean>>;
  setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
  setIsPhotoLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setTrip: React.Dispatch<React.SetStateAction<Trip | undefined>>;
}
const containerStyle = { width: '100%', height: '100%' };
// const libraries: ("places")[] = ["places"];

export default function MapComponent({ countryData, selectedPlace, setSelectedPlace, selectedDay, setPendingPlace,
  setShowTimePop, tripDaySchedule, setTripDaySchedule, setIsPhotoLoading, trip, setTrip, isPhotoLoading }: MapProps) {

  if (!countryData) return;

  // redux 使用Dispatch
  const dispatch = useDispatch();

  const [activeCountry, setActiveCountry] = useState<Country>(countryData[0]);

  // 取得此行程countryData
  const defaultCenter = activeCountry
    ? { lat: countryData[0].lat, lng: countryData[0].lng }
    : { lat: 25.033964, lng: 121.564468 }; // 台北101
  const countryCode = countryData !== undefined ? countryData[0].countryCode : "TW";

  // 初始化載入google map
  const { isLoaded } = useGoogleMaps(); // 從 Context 中獲取載入狀態

  const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const mapRef = useRef<google.maps.Map | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  // 顯示路線
  const [directionsResult, setDirectionsResult] = useState<google.maps.DirectionsResult | null>(null);
  const [currentDay, setCurrentDay] = useState<TripDaySchedule | undefined>(undefined);


  // 取得Redux目前點擊的Card的place_id
  const selectedAttractionId = useSelector((state: TripEditRootState) => state.tripEdit.selectedAttractionId);

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
    // 等到 trip 有值，才開始檢查是否需要跑圖片更新
    if (!isLoaded || !trip || !placesServiceRef.current) return;
    if (!isPhotoLoading) return;

    const updatePhotos = async () => {
      // console.log("開始更新圖片");
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
      // console.log("圖片更新完成");
    };

    updatePhotos();
  }, [isLoaded, trip, placesServiceRef.current, isPhotoLoading]);




  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // 清除舊的 listener 避免重複綁定（如果有）
    if (autocompleteRef.current) {
      google.maps.event.clearInstanceListeners(autocompleteRef.current);
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id'],
      componentRestrictions: { country: activeCountry.countryCode },
    });

    const dummyDiv = document.createElement('div');
    placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      const placeId = place?.place_id;

      if (!placeId || !placesServiceRef.current) return;

      placesServiceRef.current.getDetails(
        {
          placeId,
          fields: ['name', 'formatted_address', 'geometry', 'rating', 'opening_hours', 'photos'],
        },
        (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && result?.geometry?.location) {
            const location = {
              lat: result.geometry.location.lat(),
              lng: result.geometry.location.lng(),
            };
            setMapCenter(location);
            const id = uuidv4();
            setSelectedPlace({
              id,
              place_id: placeId,
              name: result.name,
              address: result.formatted_address,
              location,
              rating: result.rating,
              photos: result.photos?.[0]?.getUrl({ maxWidth: 500 }),
              opening_hours: result.opening_hours,
            });
          }
        }
      );
    });
  }, [isLoaded, activeCountry.countryCode]);

  // 算景點的交通時間並新增至景點資訊中
  useEffect(() => {
    if (!isLoaded) return;

    const currentDay = tripDaySchedule.find((item) => item.id === selectedDay.id);
    if (!currentDay) return;

    currentDay.transportData.forEach((item) => {
      if (!item.modeOption || item.modeOption.length === 0) {
        const origin = [{ placeId: item.fromAttractionPlaceId }];
        const destination = [{ placeId: item.toAttractionPlaceId }];
        const modes = ["DRIVING", "WALKING", "TRANSIT"] as const;

        modes.forEach((mode) => {
          const service = new google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: origin,
              destinations: destination,
              travelMode: mode as google.maps.TravelMode,
            },
            (response, status) => {
              const element = response?.rows?.[0]?.elements?.[0];

              setTripDaySchedule((prev) =>
                prev.map((day) => {
                  if (day.id !== selectedDay.id) return day;

                  const updatedTransports = day.transportData.map((t) => {
                    if (t.id !== item.id) return t;

                    const updatedOptions = [...(t.modeOption || [])];
                    const alreadyExists = updatedOptions.some((opt) => opt.mode === mode);
                    if (alreadyExists) return t;

                    if (status === "OK" && element && element.status === "OK") {
                      updatedOptions.push({
                        mode,
                        duration: element.duration.value,
                        distance: element.distance.value,
                      });
                    } else {
                      // 記錄無法查詢的交通資料（例如跨國）
                      updatedOptions.push({
                        mode,
                        duration: null,
                        distance: null,
                      });
                    }

                    return { ...t, modeOption: updatedOptions };
                  });

                  return { ...day, transportData: updatedTransports };
                })
              );
            }
          );
        });
      }
    });
  }, [selectedDay.id, tripDaySchedule, isLoaded]);

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
          // console.warn("無法取得路線（ZERO_RESULTS）：這兩點之間可能沒有可行的路線。");
          setDirectionsResult(null); // 可選：清空既有結果
        } else {
          console.error("Failed to fetch directions:", status);
        }
      }
    );
  }, [tripDaySchedule, selectedDay]);

  // 點擊地圖景點出現景點資訊
  const handleMapLoad = (map: google.maps.Map) => {
    setMapInstance(map);
    mapRef.current = map;
    // 如果placesServiceRef尚未初始化，則在此綁訂在map上
    if (!placesServiceRef.current) {
      placesServiceRef.current = new window.google.maps.places.PlacesService(map);
    }

    map.addListener('click', (e: any) => {
      if (e.placeId) {
        e.stop();

        placesServiceRef.current?.getDetails(
          {
            placeId: e.placeId,
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
                place_id: e.placeId,
                name: place.name,
                address: place.formatted_address,
                location,
                rating: place.rating,
                photos: place.photos?.[0]?.getUrl({ maxWidth: 500 }),
                opening_hours: place.opening_hours,
              });
              if (inputRef.current && place.name) {
                inputRef.current.value = place.name;
              }
            }
          }
        );
      }
    });
  };

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
          if (inputRef.current && place.name) {
            inputRef.current.value = place.name;
          }
          setMapCenter(location); // 將地圖中心移到選定的景點
        } else {
          console.error("無法獲取景點詳細資訊:", status);
        }
      }
    );
  }, [selectedAttractionId])

  // 關閉景點資訊卡
  function closeAttractionData() {
    // console.log(selectedPlace);
    setSelectedPlace(null);
    dispatch(setSelectedAttractionId(null));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  // 依關鍵字搜尋附近景點並渲染於地圖
  const handleKeywordSearch = () => {
    if (!mapInstance || !inputRef.current) return;

    const keyword = inputRef.current.value.trim();
    if (!keyword) return;

    const service = new google.maps.places.PlacesService(mapInstance);
    const request: google.maps.places.PlaceSearchRequest = {
      location: mapCenter,
      radius: 3000,
      keyword,
    };

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        // console.log("搜尋結果：", results);
        setSearchResults(results);
      } else {
        // console.error("搜尋失敗或無結果", status);
        setSearchResults([]);
      }
    });
  };

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
          if (inputRef.current && place.name) {
            inputRef.current.value = place.name;
          }
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

  //動態生成圖片url，防止token過期無法顯示圖片
  const getPhotoUrl = (photo_reference: string) => {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
  };

  // if (loadError) return <div>地圖載入錯誤</div>;
  if (!isLoaded) return <div>地圖載入中...</div>;

  return (
    <div className='relative w-full h-full'>
      {/* 搜尋列（固定在畫面上方） */}
      <div className='flex justify-between absolute top-3 left-3 w-[90%] h-12 px-5 rounded-full z-100 bg-mywhite-100 items-center shadow-md'>
        <input
          ref={inputRef}
          type="text"
          placeholder="搜尋地點"
          className='w-[80%] h-full'
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleKeywordSearch();
          }}
        />
        <div className='flex items-center gap-2'>
          <IoSearchSharp className='w-6 h-10 cursor-pointer' onClick={() => handleKeywordSearch()} />
          <RxCross2 className='w-6 h-10 cursor-pointer' onClick={() => { closeAttractionData(); setSearchResults(null); }} />
          <select
            value={activeCountry.countryCode}
            onChange={(e) => {
              const selected = countryData.find((c) => c.countryCode === e.target.value);
              if (selected) {
                setActiveCountry(selected);
                setMapCenter({ lat: selected.lat, lng: selected.lng });
              }
            }}
            className=" h-full p-2 rounded cursor-pointer"
          >
            {countryData.map((country) => (
              <option key={country.countryCode} value={country.countryCode}>
                {country.countryName}
              </option>
            ))}
          </select>
        </div>

      </div>
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
              <button
                className='mt-3 w-full px-5 py-2 bg-myblue-400 text-base-700 text-primary-300 rounded-md cursor-pointer'
                onClick={() => {
                  if (!selectedDay || selectedDay.date === null) return;

                  const newItem = {
                    id: selectedPlace.id,
                    place_id: selectedPlace.place_id,
                    name: selectedPlace.name || '',
                    formatted_address: selectedPlace.address || '',
                    lat: selectedPlace.location.lat,
                    lng: selectedPlace.location.lng,
                    photo: selectedPlace.photos || '',
                  };
                  setPendingPlace(newItem);
                  // setSelectedPlace(null); // 清除選擇，避免重複加
                  setShowTimePop(true);
                }}
              >
                加入旅程
              </button>
            </div>
          </div>

        </div>
      )}
      {/* 地圖本體 */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={handleMapLoad}
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