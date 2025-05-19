'use client'

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { IoSearchSharp } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
const containerStyle = {
  width: '100%',
  height: '100%'
};

interface Country {
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
}
interface MapProps {
  countryData: Country | undefined
}

const libraries: ("places")[] = ["places"];

export default function MapComponent({ countryData }: MapProps) {
  const defaultCenter = countryData
    ? { lat: countryData.lat, lng: countryData.lng }
    : { lat: 25.033964, lng: 121.564468 }; // 台北101

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
    language: 'zh-TW',
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    const countryCode = countryData !== undefined ? countryData.countryCode : "TW"; // 實際情況請替換為你的變數


    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: ['place_id'], // 僅取 place_id，詳細資訊之後用 getDetails()
      componentRestrictions: { country: countryCode }, // ✅ 加在這裡
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
            setSelectedPlace({
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
    console.log(countryData)
  }, [isLoaded]);

  const handleMapLoad = (map: google.maps.Map) => {
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
              // setMapCenter(location);
              setSelectedPlace({
                name: place.name,
                address: place.formatted_address,
                location,
                rating: place.rating,
                photos: place.photos,
                opening_hours: place.opening_hours,
              });
            }
          }
        );
      }
    });
  };

  if (loadError) return <div>地圖載入錯誤</div>;
  if (!isLoaded) return <div>地圖載入中...</div>;

  return (
    <div className='relative w-full h-full'>
      {/* 搜尋列（固定在畫面上方） */}
      <div className='flex justify-between absolute top-3 left-3 w-[80%] h-12 px-5 rounded-full z-100 bg-mywhite-100'>
        <input
          ref={inputRef}
          type="text"
          placeholder="搜尋地點"
          className='w-[80%] h-full'
        />
        <div className='flex items-center gap-2'>
          <IoSearchSharp className='w-6 h-10' />
          <RxCross2 className='w-6 h-10' onClick={() => setSelectedPlace(null)} />
        </div>
      </div>
      {/* 地點資訊卡（點選後才出現） */}
      {selectedPlace && (
        <div
          className='absolute bottom-3 left-3 w-[310px] h-fit flex flex-col bg-mywhite-100 p-3 rounded-[8px] z-10 shadow-[0_2px_6px_rgba(0,0,0,0.1)]'
        >
          <RxCross2 className='ml-auto'/>
          {selectedPlace.photos?.length > 0 && (
            <img
              src={selectedPlace.photos[0].getUrl({ maxWidth: 1000, maxHeight: 150 })}
              alt="地點照片"
              className='w-full h-30 object-fit'
            />
          )}
          <div className='w-full h-fit mt-2 text-lg-700 break-words'>{selectedPlace.name}</div>
          <div className='w-full h-fit mb-2 text-base-400 break-words'>{selectedPlace.address}</div>
          {selectedPlace.rating && <div className='w-full h-fit mb-1 text-base-400 break-words'>⭐ 評分：{selectedPlace.rating}</div>}
          {selectedPlace.opening_hours?.weekday_text?.length > 0 && (
            <div className='w-full'>
              <div className='mb-1'>
                <p className='text-base-400'>🕒 營業時間：</p>
              </div>
              <ul className='pl-6  h-30 m-0 overflow-y-scroll'>
                {selectedPlace.opening_hours.weekday_text.map((text: string, idx: number) => (
                  <li key={idx} className='text-base mb-1'>{text}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
            onClick={() => {
              alert(`已加入「${selectedPlace.name}」到行程表`);
            }}
          >
            ➕ 加入行程表
          </button>
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