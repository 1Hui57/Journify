'use client'
import TripPageCard from "@/component/TripPageCard";
import { useEffect, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { DateRange, DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

export default function Trip() {

    const [isAddTrip, setIsAddTrip] = useState<boolean>(false);
    const [selected, setSelected] = useState<DateRange | undefined>();
    const [deteText, setDateText] = useState<string>("");
    function handleOnSelect(range: DateRange | undefined, triggerDate: Date) {
        if (selected?.from && selected?.to) {
            setSelected({
                from: triggerDate,
                to: undefined,
            });
            return;
        }
        setSelected(range);
    }
    useEffect(() => {
        if (selected?.from && selected?.to) {
            const formattedFrom = selected.from.toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            const formattedTo = selected.to.toLocaleDateString("zh-TW", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            });
            setDateText(`${formattedFrom} ~ ${formattedTo}`);
        }
    }, [selected])


    return (
        <div className="w-full h-full ">
            <div className="w-full h-fit flex flex-col p-10 mb-20">
                <div className="w-fit h-fit mb-6">
                    <p className="text-3xl font-bold text-myblue-800">我的旅程</p>
                </div>
                <div id="tripsWrapper" className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 w-full ">
                    {/* trip card */}
                    <TripPageCard />
                    <TripPageCard />
                    <TripPageCard />
                    <TripPageCard />
                    <TripPageCard />
                    <TripPageCard />
                </div>
                <button className="fixed bottom-6 right-10 w-30 h-10 bg-primary-300 ml-auto 
                rounded-full text-base text-myblue-600 font-bold flex items-center 
                justify-center gap-1 transition-transform duration-200 hover:bg-myblue-700
                 hover:text-primary-300" onClick={() => setIsAddTrip(true)}>
                    <IoMdAdd />
                    建立旅程
                </button>
            </div>
            {isAddTrip && (
                <div className="fixed inset-0 bg-myzinc900-50  flex  items-center justify-center overflow-y-auto" onClick={() => setIsAddTrip(false)}>
                    <div className="bg-white p-6 rounded-lg shadow-lg w-120 h-168 mt-20 md:mt-0" onClick={(e) => e.stopPropagation()}>
                        <div className="text-lg font-bold text-myblue-800 mb-2">建立旅程</div>
                        <p className="text-myblue-600 font-light text-md "><span className="text-myred-400">* </span>旅程名稱</p>
                        <input type="text" placeholder="輸入旅程名稱" className="w-full h-12 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                        <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>人數</p>
                        <input type="number" placeholder="輸入旅程人數" className="w-full h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1 mb-2" />
                        <p className="text-myblue-600 font-light text-md"><span className="text-myred-400">* </span>日期</p>
                        <input type="text" placeholder="請選擇日期" readOnly className="w-full h-12 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2 mt-1"
                            value={deteText} />
                        <div className="w-fit mx-auto mt-2 text-primary-400 ">
                            <DayPicker mode="range" required selected={selected} onSelect={handleOnSelect}
                                className=""
                            />
                        </div>
                        <div className="w-fit h-fit flex ml-auto gap-3">
                            <button className="mt-4 px-4 py-2  text-myblue-800 rounded-full hover:bg-myzinc-200" onClick={()=>{setIsAddTrip(false)}}>
                                取消
                            </button>
                            <button className="mt-4 px-4 py-2 text-myblue-800 bg-primary-300 text-base-400 rounded-full hover:text-primary-300 hover:bg-myblue-600">
                                建立
                            </button>
                        </div>

                    </div>
                </div>

            )}


        </div>
    )


}