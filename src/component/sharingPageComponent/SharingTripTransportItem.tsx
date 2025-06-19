'use client'

import { TripTransport } from "@/app/type/trip";
import { useEffect, useState } from "react";


interface TransportProps {
    tripTransport: TripTransport;
}
export default function SharingTripTransportItem({ tripTransport }: TransportProps) {

    const [transporation, setTransporation] = useState<string | null>(null);
    const [duration, setDuration] = useState<number | null>();
    const [distance, setDistance] = useState<number | null>();

    useEffect(() => {
        if (tripTransport.selectedMode === "CUSTOM") {
            setTransporation("自訂");
            setDuration(tripTransport.customDuration);
            setDistance(null);
            return;
        }

        if (!tripTransport.modeOption) return;

        const selectTransportData = tripTransport.modeOption.find(item => item.mode === tripTransport.selectedMode);
        if (!selectTransportData) return;

        setDuration(selectTransportData.duration ?? null);
        setDistance(selectTransportData.distance ?? null);

        if (tripTransport.selectedMode === "WALKING") {
            setTransporation("走路");
        }
        else if (tripTransport.selectedMode === "DRIVING") {
            setTransporation("開車");
        }
        else if (tripTransport.selectedMode === "TRANSIT") {
            setTransporation("大眾運輸");
        }

    }, [tripTransport]);



    // 轉換顯示時間
    function formatDuration(durationInSeconds: number): string {
        const totalMinutes = Math.round(durationInSeconds / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        if (hours > 0) {
            return `${hours} 小時${minutes > 0 ? ` ${minutes} 分鐘` : ''}`;
        } else {
            return `${minutes} 分鐘`;
        }
    }

    // 轉換顯示距離
    function formatDistance(distanceInMeters: number): string {
        const km = distanceInMeters / 1000;
        return `${km.toFixed(1)} 公里`;
    }


    return (
        <div className="w-fit h-12 border-l-4 border-dashed border-myblue-300  ml-6  mb-2 flex items-center">
            <div className="ml-2 mr-2 w-20 text-sm-400 text-myblue-600">
                {transporation}
            </div>
            {/* 自訂模式 */}
            {tripTransport.selectedMode === "CUSTOM" && duration !== undefined && (
                <div className="text-sm-400 text-myblue-600 flex gap-2">
                    <div>{duration === null ? '暫無資料' : formatDuration(duration)}</div>
                </div>
            )}

            {/* 其他模式 */}
            {tripTransport.selectedMode !== "CUSTOM" && duration !== undefined && distance !== undefined && (
                <div className="text-sm-400 text-myblue-600 flex gap-2">
                    <div>{duration === null ? '暫無資料' : formatDuration(duration)}</div>
                    <div>{distance === null ? '暫無資料' : formatDistance(distance)}</div>
                </div>
            )}
        </div>
    )
}