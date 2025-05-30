'use client'

import { SelectTripDay, TripDaySchedule, TripTransport } from "@/app/type/trip";
import { useEffect, useState } from "react";
import { MdEdit } from "react-icons/md"; //edit


interface TransportProps {
    tripTransport: TripTransport;
    setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
    selectedDay: SelectTripDay;
}
export default function TripTransportItem({ tripTransport, setTripDaySchedule, selectedDay }: TransportProps) {

    const [transporation, setTransporation] = useState<string>(tripTransport.selectedMode);
    const [duration, setDuration] = useState<number|null>();
    const [distance, setDistance] = useState<number|null>();

    const [isEditing, setIsEditing] = useState(false); // 是否進入編輯模式
    const [customDurationInput, setCustomDurationInput] = useState<string>(""); // 使用者輸入的分鐘數

    //更新選擇的交通方式
    useEffect(() => {
        setTransporation(tripTransport.selectedMode);
        if (tripTransport.customDuration) {
            setCustomDurationInput(String(Math.round(tripTransport.customDuration / 60)));
        }
    }, [tripTransport]);

    
    useEffect(() => {
        if (transporation === "CUSTOM") {
            setDuration(tripTransport.customDuration ?? null);
            setDistance(null);
            return;
        }

        if (!tripTransport.modeOption) return;
        const selectTransportData = tripTransport.modeOption.find(item => item.mode === transporation);
        if (!selectTransportData) return;

        setDuration(selectTransportData.duration ?? null);
        setDistance(selectTransportData.distance ?? null);
    }, [transporation, tripTransport]);

   

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

    // 使用者自訂時間
    function saveCustomDuration(dayId: string, transportId: string, minutes: number) {
        const durationInSeconds = minutes * 60;
        setTripDaySchedule((prevTripDaySchedule) =>
            prevTripDaySchedule.map((day) => {
                if (day.id !== dayId) return day;

                const updatedTransports = day.transportData.map((item) => {
                    if (item.id !== transportId) return item;
                    return {
                        ...item,
                        customDuration: durationInSeconds,
                    };
                });

                return {
                    ...day,
                    transportData: updatedTransports,
                };
            })
        );
        setIsEditing(false);
    }

    return (
        <div className="w-fit h-12 border-l-4 border-dashed border-myblue-300  ml-6  mb-2 flex items-center">
            <select value={transporation}
                onChange={(e) => { updateTransport(e.target.value, selectedDay.id, tripTransport.id) }}
                className="ml-2 mr-4 w-20 text-sm-400 text-myblue-600">
                <option value="DRIVING">開車</option>
                <option value="WALKING">步行</option>
                <option value="TRANSIT">大眾運輸</option>
                <option value="CUSTOM">自訂</option>
            </select>
            {tripTransport.modeOption && duration!==undefined && distance!==undefined && tripTransport.selectedMode!=="CUSTOM" &&
                <div className="text-sm-400 text-sm-400 text-myblue-600 flex gap-2">
                    <div>{duration === null ? '暫無資料' : formatDuration(duration)}</div>
                    <div>{distance === null ? '暫無資料' : formatDistance(distance)}</div>
                </div>
            }
            {/* 自訂模式 */}
            {transporation === "CUSTOM" && (
                <div className="text-sm-400 text-myblue-600 flex items-center gap-2">
                    {!isEditing ? (
                        <>
                            <div>{duration === undefined? "未設定": duration === null? "未設定": formatDuration(duration)}</div>
                            <MdEdit
                                className="w-4 h-4 cursor-pointer text-myblue-600 hover:text-myblue-800"
                                onClick={() => setIsEditing(true)}
                            />
                        </>
                    ) : (
                        <>
                            <input
                                type="number"
                                value={customDurationInput}
                                onChange={(e) => setCustomDurationInput(e.target.value)}
                                className="w-16 border rounded px-1 text-myblue-600"
                                placeholder="分鐘"
                            />
                            <button
                                onClick={() => {
                                    const minutes = parseInt(customDurationInput);
                                    if (!isNaN(minutes)) {
                                        saveCustomDuration(selectedDay.id, tripTransport.id, minutes);
                                    }
                                }}
                                className="bg-myblue-600  text-mywhite-100 text-xs px-2 py-1 rounded"
                            >
                                儲存
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}