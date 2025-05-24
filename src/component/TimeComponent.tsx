'use client'

import { SelectTripDay, TripScheduleItem } from '@/app/type/trip';
import { Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { RxCross2 } from "react-icons/rx";
interface TimeComponentProps {
    selectedDay: SelectTripDay;
    addAttractionToDate: (dayId: string, selectedPlace: TripScheduleItem) => void;
    pendingPlace: TripScheduleItem | null;
    setShowTimePop: React.Dispatch<React.SetStateAction<boolean>>;
    setPendingPlace: React.Dispatch<React.SetStateAction<TripScheduleItem | null>>;
    dateTimeToTimestamp: (date: Date, time: string) => Timestamp;
}

export default function TimeComponent({ addAttractionToDate, selectedDay, pendingPlace, setShowTimePop,
    setPendingPlace, dateTimeToTimestamp }: TimeComponentProps) {
    const [startHour, setStartHour] = useState('10');
    const [startMinute, setStartMinute] = useState('00');
    const [endHour, setEndHour] = useState('10');
    const [endMinute, setEndMinute] = useState('00');

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));

    const stringStartTime = `${startHour}${startMinute}`;
    const stringEndTime = `${endHour}${endMinute}`;

    // 🟡 將開始時間換成數字方便比較（例如 10:30 => 1030）
    const startTimeValue = parseInt(startHour + startMinute);

    // 🟢 動態產生結束時間選項（只包含大於開始時間的選項）
    const filteredEndTimeOptions = hours.flatMap(h => {
        return minutes
            .filter(m => parseInt(h + m) > startTimeValue)
            .map(m => ({ hour: h, minute: m }));
    });

    // 🟣 檢查目前選擇的結束時間是否合法，不合法時自動調整
    useEffect(() => {
        const currentEndValue = parseInt(endHour + endMinute);
        if (currentEndValue <= startTimeValue && filteredEndTimeOptions.length > 0) {
            const firstValid = filteredEndTimeOptions[0];
            setEndHour(firstValid.hour);
            setEndMinute(firstValid.minute);
        }
    }, [startHour, startMinute]);

    return (
        <div className='relative w-72 h-56 bg-mywhite-100 text-myblue-600 flex flex-col p-3 rounded-md shadow-2xl'>
            <RxCross2 className='absolute top-2 right-2 w-5 h-5' onClick={() => setShowTimePop(false)} />
            <div className='w-fit text-lg-700 text-myblue-600 mb-5 mx-auto'>
                巴黎歌劇院
            </div>
            <div className='mb-4 w-[216px] mx-auto'>
                <label>開始時間：</label>
                <select className='w-15 h-8' value={startHour} onChange={e => setStartHour(e.target.value)}>
                    {hours.map(h => (
                        <option key={h} value={h}>{h}</option>
                    ))}
                </select>
                <span>：</span>
                <select className='w-15 h-8' value={startMinute} onChange={e => setStartMinute(e.target.value)}>
                    {minutes.map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
            </div>

            <div className='mb-7 w-[216px] mx-auto'>
                <label>結束時間：</label>
                <select className='w-15 h-8' value={endHour} onChange={e => setEndHour(e.target.value)}>
                    {filteredEndTimeOptions
                        .filter((opt, index, self) => self.findIndex(o => o.hour === opt.hour) === index) // 避免重複 hour
                        .map(opt => (
                            <option key={opt.hour} value={opt.hour}>{opt.hour}</option>
                        ))}
                </select>
                <span>：</span>
                <select className='w-15 h-8' value={endMinute} onChange={e => setEndMinute(e.target.value)}>
                    {filteredEndTimeOptions
                        .filter(opt => opt.hour === endHour)
                        .map(opt => (
                            <option key={opt.minute} value={opt.minute}>{opt.minute}</option>
                        ))}
                </select>
            </div>
            <button
                onClick={() => {
                    if (!selectedDay || selectedDay.date === null || pendingPlace === null) return;
                    const timeStampStart = dateTimeToTimestamp(selectedDay.date, stringStartTime);
                    const timeStampEnd = dateTimeToTimestamp(selectedDay.date, stringEndTime);
                    const updatedPlace: TripScheduleItem = {
                        ...pendingPlace,
                        startTime: timeStampStart,
                        endTime: timeStampEnd,
                    };
                    addAttractionToDate(selectedDay.id, updatedPlace);
                    setPendingPlace(null);
                    setShowTimePop(false);
                }}
                className=' p-2 text-base-500 text-primary-300 bg-myblue-400 rounded-md hover:text-primary-300 hover:bg-myblue-700'>確認加入</button>
        </div>
    );
}




