import { TripDaySchedule, TripScheduleItem } from "@/app/type/trip";
import { Timestamp } from "firebase/firestore";
import SharingTripTransportItem from "./SharingTripTransportItem";
import { useDispatch } from "react-redux";
import { setSelectedAttractionId } from "@/store/sharingSlice";
import { useState } from "react";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";



interface SharingTripAttractionCardProps {
    tripScheduleItem: TripScheduleItem;
    index: number;
    timestampToDateTime: (ts: Timestamp) => { date: Date, time: string };
    tripDaySchedule: TripDaySchedule;
}

export default function SharingTripAttractionCard({ tripScheduleItem, index, timestampToDateTime, tripDaySchedule }: SharingTripAttractionCardProps) {
    // redux 使用Dispatch
    const dispatch = useDispatch();

    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    return (
        <div className="w-full" key={tripScheduleItem.id} >
            <div onClick={() => dispatch(setSelectedAttractionId(tripScheduleItem.place_id))}
                className={`relative w-full  mb-2 bg-primary-100  rounded-md shadow-md cursor-pointer flex ${isExpanded ? 'h-fit' : 'h-26'}`} >

                {isExpanded ?
                    <IoChevronUp onClick={(e) => { e.stopPropagation(); setIsExpanded(prev => !prev) }}
                        className="absolute bottom-1 right-2 w-5 h-5" />
                    : <IoChevronDown onClick={(e) => { e.stopPropagation();; setIsExpanded(prev => !prev) }}
                        className="absolute bottom-1 right-2 w-5 h-5" />
                }
                <div className="absolute left-0 top-0 w-6 h-6  text-sm-400 text-mywhite-100 bg-myzinc900-80 rounded-tl-md rounded-br-md text-center z-20">{index + 1}</div>
                <div className="w-14 flex-shrink-0 flex items-stretch">
                    <div className="w-full h-auto rounded-l-md overflow-hidden">
                        <img src={tripScheduleItem.photo ? tripScheduleItem.photo : "/noPicture.png"}
                            referrerPolicy="no-referrer" alt="/noPicture.png" className="w-full h-full object-cover" />
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
                    {isExpanded && <div className="w-full h-fit  text-sm-400  border-t-2 border-myblue-200 border-dotted">
                        <p>筆記：</p>
                        <p>{!tripScheduleItem.note ? "尚無筆記" : tripScheduleItem.note}</p>
                    </div>}
                </div>
            </div>
            {index < tripDaySchedule.attractionData.length - 1 && (() => {
                const tripTransport = tripDaySchedule.transportData.find(transportItem => transportItem.fromAttractionId === tripScheduleItem.id);
                if (!tripTransport || tripTransport === undefined || tripTransport.modeOption === undefined) return;
                return (
                    <SharingTripTransportItem key={index} tripTransport={tripTransport} />
                )
            })()}
        </div>
    )
}