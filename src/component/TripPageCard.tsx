
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
                <p className="text-myblue-700 font-bold">{tripName}</p>
                {tripTime && (
                    <p className="text-myzinc-400">
                        {tripTime.tripFrom.toLocaleDateString()} ~ {tripTime.tripTo.toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    )
}
