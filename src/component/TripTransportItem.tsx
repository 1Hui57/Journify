'use client'

import { SelectTripDay, TripDaySchedule, TripTransport } from "@/app/type/trip";
import { use, useEffect, useState } from "react";

interface TransportProps {
    tripTransport: TripTransport;
    setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
    selectedDay: SelectTripDay;
}
export default function TripTransportItem({ tripTransport, setTripDaySchedule, selectedDay }: TransportProps) {

    const [transporation, setTransporation] = useState<string>(tripTransport.selectedMode);
    const [duration, setDuration] = useState<number>();
    const [distance, setDistance] = useState<number>();

    //更新選擇的交通方式
    useEffect(() => {
        setTransporation(tripTransport.selectedMode);
    }, [tripTransport])

    useEffect(() => {
        if (!tripTransport.modeOption) return;
        const selectTransportData = tripTransport.modeOption.find(item => item.mode === transporation);
        if (!selectTransportData) return;
        const tripDuration = selectTransportData.duration === undefined ? undefined : selectTransportData.duration;
        const tripDistance = selectTransportData.distance === undefined ? undefined : selectTransportData.distance;
        setDuration(tripDuration === undefined ? undefined : tripDuration);
        setDistance(tripDistance === undefined ? undefined : tripDistance);
    }, [transporation, tripTransport.modeOption])

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

    // 選擇交通方式後要更新tripDaySchedule的交通方式
    function updateTransport(transporation: string, dayId: string, transportId: string) {
        setTripDaySchedule((prevTripDaySchedule) =>
            prevTripDaySchedule.map((day) => {
                if (day.id !== dayId) return day;

                const updatedTransports = day.transportData.map((item) => {
                    if (item.id !== transportId) return item;
                    return {
                        ...item,
                        selectedMode: transporation,
                    };
                });

                return {
                    ...day,
                    transportData: updatedTransports,
                };
            })
        );
    }

    return (
        <div className="w-fit h-12 border-l-4 border-dashed border-myblue-300  ml-8  mb-2 flex items-center">
            <select value={transporation}
                onChange={(e) => {updateTransport(e.target.value,selectedDay.id,tripTransport.id)}}
                className="ml-2 mr-4 W-8">
                <option value="DRIVING">開車</option>
                <option value="WALKING">步行</option>
                <option value="TRANSIT">大眾運輸</option>
                <option value="CUSTOM">自訂</option>
            </select>
            {tripTransport.modeOption &&
                <div className="text-sm-400">
                    <div>
                        時間：
                        {duration === undefined ? '暫無資料' : formatDuration(duration)}
                    </div>
                    <div>
                        距離：
                        {distance === undefined ? '暫無資料' : formatDistance(distance)}
                    </div>
                </div>

            }

        </div>
    )
}