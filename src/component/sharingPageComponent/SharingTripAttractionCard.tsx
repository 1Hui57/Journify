import { TripDaySchedule, TripScheduleItem } from "@/app/type/trip";
import { Timestamp } from "firebase/firestore";
import SharingTripTransportItem from "./SharingTripTransportItem";


interface SharingTripAttractionCardProps{
    tripScheduleItem:TripScheduleItem;
    index:number;
    timestampToDateTime:(ts: Timestamp) => { date: Date, time: string };
    tripDaySchedule:TripDaySchedule;
}

export default function SharingTripAttractionCard({tripScheduleItem, index, timestampToDateTime, tripDaySchedule}:SharingTripAttractionCardProps){
    return(
         <div className="w-full" key={tripScheduleItem.id} >
                    <div
                        className="relative w-full  mb-2 bg-primary-100  rounded-md shadow-md cursor-pointer flex h-26" >
                        
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
                        </div>
                    </div>
                    {index < tripDaySchedule.attractionData.length - 1 && (() => {
                        const tripTransport = tripDaySchedule.transportData.find(transportItem => transportItem.fromAttractionId === tripScheduleItem.id);
                        if (!tripTransport || tripTransport === undefined || tripTransport.modeOption === undefined) return;
                        return (
                            <SharingTripTransportItem key={index} tripTransport={tripTransport}  />
                        )
                    })()}
                </div>
    )
}