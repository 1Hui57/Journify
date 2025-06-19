'use client'
import { useJsApiLoader } from '@react-google-maps/api';
import { createContext, useContext, useEffect, useState } from 'react';

interface MapContextType {
    isLoaded: boolean;
}
// 建立useContext物件
const MapContext = createContext<MapContextType>({
    isLoaded: false
})
const libraries: ("places")[] = ["places"];

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
    const [mapApiLoaded, setMapApiLoaded] = useState(false);
    // 初始化載入google map
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
        libraries,
        language: 'zh-TW',
        id: 'google-map-script-loader',
    });

    useEffect(() => {
        if (isLoaded) {
            setMapApiLoaded(true);
        }
    }, [isLoaded]);

    if (loadError) return <div>地圖載入錯誤：{loadError.message}</div>;

    if (!isLoaded) return (
        <div className="fixed top-0 w-full h-full bg-myzinc900-60 z-1000 flex flex-col items-center justify-center">
            <img src="/loading.gif" className="w-30 h-30 " />
            <p className="text-mywhite-100">旅雀加載中...請稍後</p>
        </div>
    );

    return (
        <MapContext.Provider value={{ isLoaded: mapApiLoaded }}>
            {children}
        </MapContext.Provider>
    );
};

export const useGoogleMaps = () => useContext(MapContext);