'use client'

import { SelectTripDay, TripDaySchedule } from "@/app/type/trip"
import { useState } from "react";
import { MdDelete } from "react-icons/md"; //  delete

interface TripDaySelectProps {
    item: TripDaySchedule;
    selectedDay: SelectTripDay;
    selectDate: (id: string, date: Date) => void;
}
export default function TripDaySelect({ item, selectedDay, selectDate }: TripDaySelectProps) {

    // 天數列表是否 Hover，true顯示 delete 按鍵
    const [isDayHover, setIsDayHover] = useState<boolean>(false);
    
    return (
        <div onClick={() => selectDate(item.id, item.rawDate)}
        onMouseEnter={()=>{setIsDayHover(true)}}
        onMouseLeave={()=>{setIsDayHover(false)}}
            className={`w-30 flex-shrink-0 text-center cursor-pointer relative ${item.id === selectedDay.id ?
                'text-sm-700 border-b-5 border-primary-600'
                : 'text-sm-400 border-x-1 border-myzinc-200'}`}>
            <p>{item.date}</p>
            <p>第{item.number}天</p>
            {isDayHover && <MdDelete className="absolute w-4 h-4 top-1 right-1 text-primary-800"/>}
            
        </div>
    )
}