'use client'

import { TripDaySchedule, SelectTripDay, TripScheduleItem } from "@/app/type/trip";
import { Timestamp } from "firebase/firestore";
import { AiOutlineMore } from "react-icons/ai";
import { IoMdTime } from "react-icons/io";
import { MdEditNote, MdDeleteOutline } from "react-icons/md";
import TripTransportItem from "./TripTransportItem";
import { useState } from "react";
import { IoChevronDown } from "react-icons/io5";
import { IoChevronUp } from "react-icons/io5";
// redux用
import { useDispatch } from "react-redux";
import { setShowNotePopup, setEditingItemId, setEditingTripItem, setShowEditTimePopup } from "@/store/tripSlice"


interface TripAttractionCardProps {
    tripScheduleItem: TripScheduleItem;
    index: number;
    tripDaySchedule: TripDaySchedule;
    timestampToDateTime: (ts: Timestamp) => { date: Date, time: string };
    setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
    selectedDay: SelectTripDay;
    deleteAttractionfromDate: (dayId: string, tripScheduleItemId: string) => void;
    setEditTripScheduleItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function TripAttractionCard({ tripScheduleItem, index, selectedDay, tripDaySchedule,
    timestampToDateTime, setTripDaySchedule, deleteAttractionfromDate, setEditTripScheduleItemId }: TripAttractionCardProps) {

    // redux 使用Dispatch
    const dispatch = useDispatch();

    const [isHover, setIsHover] = useState<boolean>(false);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    // Redux無法儲存非序列化資料，因此將TimeStamp資料先轉為毫秒
    function convertTripItem(item: any) {
        return {
            ...item,
            startTime: item.startTime?.toMillis?.() ?? null, // 或用 .toDate().toISOString()
            endTime: item.endTime?.toMillis?.() ?? null,
        };
    }
    return (
        <div className="w-full" key={tripScheduleItem.id}>
            <div
                className={`relative w-full  mb-2 bg-primary-100  rounded-md shadow-md cursor-pointer flex ${isExpanded ? 'h-60' : 'h-26'}`}>
                <AiOutlineMore className="absolute top-2 right-0 w-6 h-6 " onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} onClick={(e) => {
                    e.stopPropagation(); // 阻止點擊冒泡，不讓外層 onClick 執行
                }} />
                {isExpanded ? <IoChevronUp onClick={() => setIsExpanded(prev => !prev)} className="absolute bottom-1 right-2 w-5 h-5" /> : <IoChevronDown onClick={() => setIsExpanded(prev => !prev)} className="absolute bottom-1 right-2 w-5 h-5" />
                }
                {isHover &&
                    <div className="absolute top-8 right-0 w-fit h-fit px-4 py-2 flex flex-col gap-2 rounded-md justify-center text-sm-400 text-myzinc-400 bg-mywhite-100 shadow-md z-10"
                        onMouseEnter={() => setIsHover(true)} onMouseLeave={() => setIsHover(false)} onClick={(e) => { e.stopPropagation(); }}>
                        <div onClick={(e) => { e.stopPropagation(); dispatch(setEditingTripItem(convertTripItem(tripScheduleItem))); dispatch(setShowEditTimePopup(true)); }}
                            className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100 flex items-center justify-center gap-2 cursor-pointer">
                            <IoMdTime />
                            <p>時間</p>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); dispatch(setEditingTripItem(convertTripItem(tripScheduleItem))); dispatch(setShowNotePopup(true)); }}
                            className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100 flex items-center justify-center gap-2 cursor-pointer">
                            <MdEditNote />
                            <p>筆記</p>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); deleteAttractionfromDate(selectedDay.id, tripScheduleItem.id) }}
                            className="w-full text-center hover:text-myred-400 hover:font-700 hover:bg-myzinc-100 flex items-center justify-center gap-2 cursor-pointer">
                            <MdDeleteOutline />
                            <p>刪除</p>
                        </div>
                    </div>
                }
                <div className="relative w-14 h-full">
                    <div className="absolute left-0 top-0 w-6 h-6  text-sm-400 text-mywhite-100 bg-myzinc900-80 rounded-tl-md rounded-br-md text-center">{index + 1}</div>
                    <div className="w-full h-full rounded-l-md overflow-hidden">
                        <img src={tripScheduleItem.photo} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                    </div>
                </div>
                <div className="flex-1 py-2 px-2 flex flex-col gap-1 ">
                    <div className="text-sm-500 line-clamp-1">{tripScheduleItem.name}</div>
                    <div className="text-sm-400 line-clamp-2 h-10">{tripScheduleItem.formatted_address}</div>
                    {tripScheduleItem.startTime && tripScheduleItem.endTime && (() => {
                        const start = timestampToDateTime(tripScheduleItem.startTime);
                        const end = timestampToDateTime(tripScheduleItem.endTime);
                        return (
                            <div className="text-sm-400 text-myzinc-700">
                                時間：{start.time}~{end.time}
                            </div>
                        );
                    })()}
                    {isExpanded && <div className="w-full h-30  text-xs-400  border-t-2 border-myblue-200 border-dotted">
                        <p>筆記：</p>
                        <p>{tripScheduleItem.note}</p>
                    </div>}
                </div>
            </div>
            {index < tripDaySchedule.attractionData.length - 1 && (() => {
                const tripTransport = tripDaySchedule.transportData.find(transportItem => transportItem.fromAttractionId === tripScheduleItem.id);
                if (!tripTransport || tripTransport === undefined || tripTransport.modeOption === undefined) return;
                return (
                    <TripTransportItem key={index} tripTransport={tripTransport} setTripDaySchedule={setTripDaySchedule} selectedDay={selectedDay} />
                )
            })()}
        </div>
    )
}