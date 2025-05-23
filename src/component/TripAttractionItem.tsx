'use client'

import { TripDaySchedule } from "@/app/type/trip"
import { Timestamp } from "firebase/firestore";
import { DiVim } from "react-icons/di";

interface TripAttractionProps {
    tripDaySchedule: TripDaySchedule;
    timestampToDateTime: (ts: Timestamp) => { date: Date, time: string };
}
export default function TripAttractionItem({ tripDaySchedule, timestampToDateTime }: TripAttractionProps) {

    return (
        <div className="w-full h-full px-4">
            <div className="w-fit h-fit py-2 ml-3 mt-3 mb-3 text-base-700 text-myzinc-900 border- rounded-md">{`第${tripDaySchedule.number}天`}</div>
            {tripDaySchedule.attractionData && tripDaySchedule.attractionData.length > 0 &&
                tripDaySchedule.attractionData.map((item, index) =>
                    <div className="w-full" key={item.id}> 
                        <div  className="w-full  mb-2 h-26 bg-primary-100  rounded-md shadow-md flex overflow-hidden">
                            <div className="relative w-14 h-full">
                                <div className="absolute left-0 top-0 w-6 h-6  text-sm-400 text-mywhite-100 bg-myzinc900-80 rounded-br-md text-center">{index + 1}</div>
                                <div className="w-full h-full overflow-hidden">
                                    <img src={item.photo} referrerPolicy="no-referrer" alt="" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="flex-1 py-4 px-2 ">
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
                        </div>
                        {index < tripDaySchedule.attractionData.length - 1 &&
                            (<div key={index} className="w-fit h-12 border-l-4 border-dashed border-myblue-300  ml-8  mb-2 flex items-center">
                                <div className="w-3 h-full border-"></div>
                                交通
                            </div>)
                        }
                    </div>


                )

            }
        </div>
    )
}