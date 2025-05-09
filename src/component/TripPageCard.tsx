export default function TripPageCard(){
    return(
        <div className="bg-mywhite-100 h-50 max-w-88 rounded-md overflow-hidden shadow-md">
            <div className="w-full h-[70%]">
                <img src="/Osaka.jpg" className="w-full h-full object-cover" />
            </div>
            <div className="w-full h-full py-1 px-2">
                <p className="text-myblue-700 font-bold">大阪3天2夜</p>
                <p className="text-myzinc-400">2025/05/30-2025/06/03</p>
            </div>
            
        </div>
    )
}
