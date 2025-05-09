export default function HomeTripCard() {
    return (
        <div className="flex-1  min-w-[300px] h-[360px]  rounded-md overflow-hidden">
            <img src="/Tokyo.jpg" className="w-full h-[68%] rounded-md object-cover" />
            <div className="w-full pl-2 pr-2 pt-1 flex flex-col gap-1">
                <p className="text-myblue-300">1 天</p>
                <p className="text-black text-lg font-bold">東京二日-東京必去的10個景點-我只是想知道字數會不會超過</p>
                <div className="w-full h-[35px] flex justify-between items-center">
                    <p className="text-myblue-300 w-fit">小貓</p>
                    <div className="relative flex-grow w-fit flex  gap-2 justify-end">
                        <img src="/good-empty.png" className="w-5 h-5 " />
                        <p>150</p>
                        <img src="/collect-empty.png" className="w-5 h-6 ml-2" />
                    </div>
                </div>
            </div>
        </div>
    )
}