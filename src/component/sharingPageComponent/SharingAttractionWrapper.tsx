'use client'

import { SelectTripDay, TripDaySchedule } from "@/app/type/trip"
import { Timestamp } from "firebase/firestore";
import TripAttractionCard from "../TripAttractionCard";
import SharingTripAttractionCard from "./SharingTripAttractionCard";

interface TripAttractionProps {
    tripDaySchedule: TripDaySchedule;
    timestampToDateTime: (ts: Timestamp) => { date: Date, time: string };

}
export default function SharingAttractionWrappwer({ tripDaySchedule, timestampToDateTime, 
     }: TripAttractionProps) {

    return (
        <div className="w-full h-fit px-4 ">
            <div className="w-fit h-fit py-2 ml-3 mt-1 mb-1 md:mt-3 md:mb-3 text-base-700 text-myzinc-900 border- rounded-md">{`第${tripDaySchedule.number}天`}</div>
            {tripDaySchedule.attractionData && tripDaySchedule.attractionData.length > 0 &&
                tripDaySchedule.attractionData.map((tripScheduleItem, index) => {
                    return (
                        <SharingTripAttractionCard key={tripScheduleItem.id} tripScheduleItem={tripScheduleItem} index={index} timestampToDateTime={timestampToDateTime} tripDaySchedule={tripDaySchedule}
                              />
                    )
                }
                )
            }
        </div>
    )
}