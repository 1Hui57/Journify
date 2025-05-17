'use client'

import { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const center = {
  lat: 25.033964, // 台北101
  lng: 121.564468
};

export default function MapComponent() {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries: ['places'], // 可選，例如自動完成用
  });

  if (loadError) return <div>地圖載入錯誤</div>;
  if (!isLoaded) return <div>地圖載入中...</div>;

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
    >
      {/* 可以加 Marker 等元件 */}
    </GoogleMap>
  );
}