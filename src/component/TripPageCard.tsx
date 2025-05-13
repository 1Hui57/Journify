import { MdOutlinePeopleAlt } from "react-icons/md";
import { IoIosMore } from "react-icons/io";
import { useState } from "react";

interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface Trip {
    id?: string;
    tripName: string;
    person: Number;
    tripTime: TripTime;
    isPublic: boolean;
}
interface TripPageCardProps {
    tripPerson: Number;
    deleteTrip: (userId: string, tripId: string) => Promise<void>;
    userId: string | undefined;
    item: Trip;
    updateTripPrivate: (userId: string, tripId: string, isPublic: boolean) => Promise<void>
}

export default function TripPageCard({ tripPerson, deleteTrip, userId, item, updateTripPrivate }: TripPageCardProps) {

    const [ isPublic, setIsPublic] = useState<boolean>(item.isPublic);
    const [isMoreHover, setIsMoreHover] = useState<boolean>(false);


    return (
        <div className="bg-mywhite-100 h-50 w-full rounded-md overflow-hidden shadow-md cursor-pointer transition-transform duration-200 hover:scale-105">
            <div className="relative w-full h-[70%] text-myzinc-900">
                <img src="/Osaka.jpg" className="w-full h-full object-cover" />
                <IoIosMore className="absolute top-0 right-1.5 w-6 h-7" onMouseEnter={() => setIsMoreHover(true)} onMouseLeave={() => setIsMoreHover(false)} />
                {isMoreHover &&
                    <div className="absolute top-6 right-0 w-24 h-fit px-2 py-3 flex flex-col gap-2 rounded-md justify-center text-myzinc-400 bg-mywhite-100" onMouseEnter={() => setIsMoreHover(true)} onMouseLeave={() => setIsMoreHover(false)}>
                        <div className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100">更新</div>
                        {isPublic ?
                            <div className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100" onClick={() => {updateTripPrivate(userId as string, item.id as string, isPublic);setIsPublic(false)}}>設為私人</div>
                            : <div className="w-full text-center hover:text-myblue-700 hover:font-700 hover:bg-myzinc-100" onClick={() => {updateTripPrivate(userId as string, item.id as string, isPublic);setIsPublic(true)}}>公開</div>
                        }
                        <div onClick={() => deleteTrip(userId as string, item.id as string)} className="w-full text-center hover:text-myred-400 hover:font-700 hover:bg-myzinc-100">刪除</div>
                    </div>
                }
            </div>
            <div className="w-full h-full py-1 px-2">
                <p className="text-myblue-700 font-bold line-clamp-1">{item.tripName}</p>
                <div className="w-full flex ">
                    {item.tripTime && (
                        <p className="text-myzinc-400 text-sm line-clamp-1">
                            {item.tripTime.tripFrom.toLocaleDateString()} ~ {item.tripTime.tripTo.toLocaleDateString()}
                        </p>
                    )}
                    <div className="w-fit flex ml-auto items-end gap-1 text-myzinc-400">
                        <MdOutlinePeopleAlt className="w-5 h-5" />
                        <p>{String(tripPerson)}</p>
                    </div>
                </div>

            </div>
        </div>
    )
}
