import { MdOutlinePeopleAlt } from "react-icons/md";

interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface TripPageCardProps {
    tripName: string;
    tripPerson: Number;
    tripTime: TripTime | undefined;
}

export default function TripPageCard({ tripName, tripPerson, tripTime }: TripPageCardProps) {
    return (
        <div className="bg-mywhite-100 h-50 w-full rounded-md overflow-hidden shadow-md cursor-pointer transition-transform duration-200 hover:scale-105">
            <div className="w-full h-[70%]">
                <img src="/Osaka.jpg" className="w-full h-full object-cover" />
            </div>
            <div className="w-full h-full py-1 px-2">
                <p className="text-myblue-700 font-bold line-clamp-1">{tripName}</p>
                <div className="w-full flex ">
                    {tripTime && (
                        <p className="text-myzinc-400 text-sm line-clamp-1">
                            {tripTime.tripFrom.toLocaleDateString()} ~ {tripTime.tripTo.toLocaleDateString()}
                        </p>
                    )}
                    <div className="w-fit flex ml-auto items-end gap-1 text-myzinc-400">
                        <MdOutlinePeopleAlt className="w-5 h-5"/>
                        <p>{String(tripPerson)}</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
