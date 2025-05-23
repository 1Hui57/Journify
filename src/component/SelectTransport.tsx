'use client'

import { RxCross2 } from "react-icons/rx"; //叉叉
import { MdDriveEta } from "react-icons/md"; //車
import { FaWalking } from "react-icons/fa"; //走路
import { IoMdBicycle } from "react-icons/io"; // 腳踏車
import { FaBusAlt } from "react-icons/fa"; //大眾交通
import { useState } from "react";

interface SelectTransportProps{
    setTransporation:React.Dispatch<React.SetStateAction<string>>;
}
export default function SelectTransport({setTransporation}:SelectTransportProps) {

    const [] = useState();
    return (
        <div className='relative w-72 h-56 bg-mywhite-100 text-myblue-600 flex flex-col p-3 rounded-md shadow-2xl'>
            <RxCross2 className='absolute top-2 right-2 w-5 h-5' />
            <label>交通方式</label>
            <select>
                <option value="" disabled>請選擇交通方式</option>
                <option value="DRIVING">開車</option>
                <option value="WALKING">步行</option>
                <option value="TRANSIT">大眾運輸</option>
                <option value="CUSTOM">自訂</option>
            </select>
        </div>
    )
}