'use client'
interface TripScheduleItem {
    id: string;
    name: string;
    formatted_address: string;
    lat: number;
    lng: number;
    photo: string;
    startTime: Date;
    endTime: Date;
}
interface TripDaySchedule {
    id: string;
    rawDate: Date;
    date: string;      // 格式：2025.05.12
    number: number;     // 例如：1
    isChoose: boolean;
    data: TripScheduleItem[];
}
interface TripAttractionProps {
    tripDaySchedule: TripDaySchedule
}
export default function TripAttractionItem({ tripDaySchedule }: TripAttractionProps) {

    return (
        <div className="w-full h-full">
            <div className="w-fit h-fit px-4 py-2 ml-3 mt-3  text-base-700 text-myzinc-900 border- rounded-md">{`第${tripDaySchedule.number}天`}</div>
            {tripDaySchedule.data && tripDaySchedule.data.length > 0 && tripDaySchedule.data.map(item =>
                <div key={item.id} className="w-35 h-30 bg-amber-100">
                    行程內容
                </div>
            )

            }
        </div>
    )
}