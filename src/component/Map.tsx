'use client'

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Timestamp } from 'firebase/firestore';
import { IoSearchSharp } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import { v4 as uuidv4 } from 'uuid';
import { Country, Place, SelectTripDay, TripDaySchedule, TripScheduleItem } from '@/app/type/trip';

interface MapProps {
  countryData: Country | undefined;
  selectedPlace: Place | null;
  selectedDay: SelectTripDay;
  tripDaySchedule: TripDaySchedule[];
  setSelectedPlace: React.Dispatch<React.SetStateAction<Place | null>>;
  setPendingPlace: React.Dispatch<React.SetStateAction<TripScheduleItem | null>>;
  setShowTimePop: React.Dispatch<React.SetStateAction<boolean>>;
  setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
}
const containerStyle = { width: '100%', height: '100%' };
const libraries: ("places")[] = ["places"];

export default function MapComponent({ countryData, selectedPlace, setSelectedPlace, selectedDay, setPendingPlace, setShowTimePop, tripDaySchedule, setTripDaySchedule }: MapProps) {
  // 取得此行程countryData
  const defaultCenter = countryData
    ? { lat: countryData.lat, lng: countryData.lng }
    : { lat: 25.033964, lng: 121.564468 }; // 台北101
  const countryCode = countryData !== undefined ? countryData.countryCode : "TW";

  // 初始化載入google map
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    language: 'zh-TW',
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {

    if (!isLoaded || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id'], // 僅取 place_id，詳細資訊之後用 getDetails()
      componentRestrictions: { country: countryCode },
    });

    const dummyDiv = document.createElement('div');
    placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDiv);

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();
      const placeId = place?.place_id;

      if (!placeId || !placesServiceRef.current) return;

      // 取得景點詳細資料
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
              id: id,
              place_id: placeId,
              name: result.name,
              address: result.formatted_address,
              location,
              rating: result.rating,
              photos: result.photos,
              opening_hours: result.opening_hours,
            });
          }
        }
      );
    });
  }, [isLoaded]);

  useEffect(() => {
    const currentDay = tripDaySchedule.find((item) => item.id === selectedDay.id);
    if (!currentDay) return;

    currentDay.transportData.forEach((item) => {
      if (!item.modeOption || item.modeOption.length === 0) {
        const origin = [{ placeId: item.fromAttractionPlaceId }];
        const destination = [{ placeId: item.toAttractionPlaceId }];
        const modes = ["DRIVING", "WALKING", "TRANSIT"] as const;
        // console.log("origin", origin);
        // console.log("destination", destination);
        // console.log("place_id from", item.fromAttractionPlaceId);
        // console.log("place_id to", item.toAttractionPlaceId);

        modes.forEach((mode) => {
          const service = new google.maps.DistanceMatrixService();
          service.getDistanceMatrix(
            {
              origins: origin,
              destinations: destination,
              travelMode: mode as google.maps.TravelMode,
            },
            (response, status) => {
              // console.log(response);
              // console.log(status);

              if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
                const element = response.rows[0].elements[0];
                const duration = element.duration.value;
                const distance = element.distance.value;

                setTripDaySchedule((prev) =>
                  prev.map((day) => {
                    if (day.id !== selectedDay.id) return day;

                    const updatedTransports = day.transportData.map((t) => {
                      if (t.id !== item.id) return t;
                      const updatedOptions = [...(t.modeOption || [])];

                      updatedOptions.push({ mode, duration, distance });

                      return { ...t, modeOption: updatedOptions };
                    });

                    return { ...day, transportData: updatedTransports };
                  })
                );
              }
            }
          );
        });
      }
    });
  }, [selectedDay.id, tripDaySchedule]);

  const handleMapLoad = (map: google.maps.Map) => {
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
                photos: place.photos,
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

  function closeAttractionData() {
    console.log(selectedPlace);
    setSelectedPlace(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }


  if (loadError) return <div>地圖載入錯誤</div>;
  if (!isLoaded) return <div>地圖載入中...</div>;

  return (
    <div className='relative w-full h-full'>
      {/* 搜尋列（固定在畫面上方） */}
      <div className='flex justify-between absolute top-3 left-3 w-[90%] h-12 px-5 rounded-full z-100 bg-mywhite-100'>
        <input
          ref={inputRef}
          type="text"
          placeholder="搜尋地點"
          className='w-[80%] h-full'
        />
        <div className='flex items-center gap-2'>
          {/* <IoSearchSharp className='w-6 h-10' /> */}
          <RxCross2 className='w-6 h-10 cursor-pointer' onClick={() => closeAttractionData()} />
        </div>
      </div>
      {/* 地點資訊卡（點選後才出現） */}
      {selectedPlace && (
        <div
          className='absolute bottom-3 left-3 w-60 md:w-80 h-fit flex flex-col bg-mywhite-100 rounded-[8px] z-10 shadow-[0_2px_6px_rgba(0,0,0,0.1)]'
        >
          {selectedPlace?.photos && selectedPlace.photos.length > 0 && selectedPlace.photos[0] && (
            <div className='relative w-full h-20 md:h-40 rounded-t-[8px] overflow-hidden'>
              <RxCross2
                onClick={closeAttractionData}
                className='absolute right-2 top-2 z-20 w-6 h-6 rounded-full bg-mywhite-50'
              />
              <img
                src={selectedPlace.photos[0].getUrl({ maxWidth: 1000, maxHeight: 350 })}
                alt="地點照片"
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
                  photo: selectedPlace.photos?.[0]?.getUrl() || '',
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
      )}
      {/* 地圖本體 */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={14}
        onLoad={handleMapLoad}
        options={{
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
        }}
      >
        {selectedPlace && <Marker position={selectedPlace.location} />}
      </GoogleMap>
    </div>
  );
}