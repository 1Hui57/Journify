import TripPageCard from "@/component/TripPageCard";

export default function Trip() {
    return (
        <div className="w-full h-full flex flex-col p-10 mb-20">
            <div className="w-fit h-fit mb-6">
                <p className="text-3xl font-bold text-myblue-800">我的旅程</p>
            </div>
            <div id="tripsWrapper" className="grid gap-5 grid-cols-[repeat(auto-fit,minmax(230px,1fr))] w-full ">
                {/* trip card */}
                <TripPageCard />
                <TripPageCard />
            </div>
            <button className="fixed bottom-6 right-10 w-30 h-10 bg-primary-300 ml-auto rounded-full text-base text-myblue-600 font-bold flex items-center justify-center gap-1">
                <img src="/add.png" className="w-4 h-4" />
                建立旅程
            </button>
        </div>
    )


}