'use client'

import { SelectTripDay, TripDaySchedule } from "@/app/type/trip"
import { Timestamp } from "firebase/firestore";
import TripTransportItem from "./TripTransportItem";
import { AiOutlineMore } from "react-icons/ai";
import { useState } from "react";
import { IoMdTime } from "react-icons/io"; //time
import { MdEditNote } from "react-icons/md"; //note
import { MdDeleteOutline } from "react-icons/md"; //delete


interface TripAttractionProps {
    tripDaySchedule: TripDaySchedule;
    timestampToDateTime: (ts: Timestamp) => { date: Date, time: string };
    setTripDaySchedule: React.Dispatch<React.SetStateAction<TripDaySchedule[]>>;
    selectedDay: SelectTripDay;
    deleteAttractionfromDate: (dayId: string, tripScheduleItemId: string) => void;

}
export default function TripAttractionItem({ tripDaySchedule, timestampToDateTime, setTripDaySchedule, selectedDay, deleteAttractionfromDate }: TripAttractionProps) {

    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="w-full h-fit px-4 ">
            <div className="w-fit h-fit py-2 ml-3 mt-3 mb-3 text-base-700 text-myzinc-900 border- rounded-md">{`第${tripDaySchedule.number}天`}</div>
            {tripDaySchedule.attractionData && tripDaySchedule.attractionData.length > 0 &&
                tripDaySchedule.attractionData.map((item, index) => {
                    const isHovered = hoveredId === item.id;
                    return (
                        <div className="w-full" key={item.id}>
                            <div className="relative w-full  mb-2 h-26 bg-primary-100  rounded-md shadow-md flex ">
                                <AiOutlineMore className="absolute top-2 right-0 w-6 h-6 " onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)} />
                                {isHovered &&
                                    <div className="absolute top-8 right-0 w-fit h-fit px-4 py-2 flex flex-col gap-2 rounded-md justify-center text-sm-400 text-myzinc-400 bg-mywhite-100 shadow-md z-10" onMouseEnter={() => setHoveredId(item.id)} onMouseLeave={() => setHoveredId(null)}>
                                        <div className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100 flex items-center justify-center gap-2 cursor-pointer">
                                            <IoMdTime />
                                            <p>時間</p>
                                        </div>
                                        <div className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100 flex items-center justify-center gap-2 cursor-pointer">
                                            <MdEditNote />
                                            <p>筆記</p>
                                        </div>
                                        <div onClick={()=>deleteAttractionfromDate(selectedDay.id,item.id)}
                                        className="w-full text-center hover:text-myred-400 hover:font-700 hover:bg-myzinc-100 flex items-center justify-center gap-2 cursor-pointer">
                                            <MdDeleteOutline />
                                            <p>刪除</p>
                                        </div>
                                    </div>
                                }
                                <div className="relative w-14 h-full">
                                    <div className="absolute left-0 top-0 w-6 h-6  text-sm-400 text-mywhite-100 bg-myzinc900-80 rounded-tl-md rounded-br-md text-center">{index + 1}</div>
                                    <div className="w-full h-full rounded-l-md overflow-hidden">
                                        <img src={item.photo} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <div className="flex-1 py-2 px-2 flex flex-col gap-1 ">
                                    <div className="text-sm-500">{item.name}</div>
                                    <div className="text-sm-400">{item.formatted_address}</div>
                                    {item.startTime && item.endTime && (() => {
                                        const start = timestampToDateTime(item.startTime);
                                        const end = timestampToDateTime(item.endTime);
                                        return (
                                            <div className="text-sm-400 text-myzinc-700">
                                                時間：{start.time}~{end.time}
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="absolute bottom-1 right-2 text-xs-400">查看筆記</div>
                            </div>
                            {index < tripDaySchedule.attractionData.length - 1 && (() => {
                                const tripTransport = tripDaySchedule.transportData.find(transportItem => transportItem.fromAttractionId === item.id);
                                if (!tripTransport || tripTransport === undefined || tripTransport.modeOption === undefined) return;
                                return (
                                    <TripTransportItem key={index} tripTransport={tripTransport} setTripDaySchedule={setTripDaySchedule} selectedDay={selectedDay} />
                                )
                            })()}
                        </div>
                    )
                }
                )
            }
        </div>
    )
}