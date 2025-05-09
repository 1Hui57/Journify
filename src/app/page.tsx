'use client'
import HotCounty from "@/component/HoyCounty";
import "../style.css"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';
import SearchBar from "@/component/SearchBar";
import HomeTripCard from "@/component/HomeTripCard";
// import "../style/style.css"
// import { auth } from '@/lib/firebase';
// import {
//     createUserWithEmailAndPassword, signInWithEmailAndPassword,
//     setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged
// } from "firebase/auth";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";
// import { db } from "@/lib/firebase";

export default function Home() {
    return (
        <div className='flex flex-col max-w-6xl w-full h-full m-auto pl-8 pr-8'>
            <div className='w-full h-fit pt-8 mb-2 flex flex-col gap-5'>
                <p className="w-full sm:text-3xl text-2xl font-extrabold text-myblue-700 leading-relaxed">Journify幫你輕鬆安排行程</p>
                <p className="text-zinc-500 sm:text-[20px] text-[18px] font-400">超過 38,512 人都在使用的排程網站</p>
            </div>
            
            <div className='w-full h-full md:h-64 flex flex-col md:flex-row mt-5  mb-5 gap-5'>
                <div className='bg-primary-300 h-42 w-full md:w-2/5 p-6 rounded-4xl flex flex-col sm:h-full'>
                    <h3 className='text-myblue-700'>開始規劃</h3>
                    <h1 className='text-myblue-700'>你的旅程</h1>
                    <button className='text-mywhite-100 bg-myblue-600 w-20 h-10  self-end rounded-full font-bold'>START</button>
                </div>
                <div className='h-full w-full md:w-3/5 flex flex-col '>
                    <div className="w-full  h-[70px] flex gap-5 pl-3 md:pl-0 mb-2">
                        <div className="w-1 h-[40px] bg-primary-400"></div>
                        <h2 className="w-full text-myblue-700">熱門城市</h2>
                    </div>
                    <div id="hotCounty" className="w-full h-full flex gap-x-4 overflow-x-auto px-3 md:px-0 mb-3 md:mb-0">
                        <HotCounty />
                        <HotCounty />
                        <HotCounty />
                        <HotCounty />
                    </div>
                </div>
            </div>
            <SearchBar />
            <div className="w-full pl-3 flex gap-5 mt-6  items-center">
                <div className="w-1 h-[40px] bg-primary-400"></div>
                <h2 className="w-fit text-myblue-700">熱門旅程</h2>
                <button className="w-fit self-end mt-3 flex items-center gap-2 pr-2 ml-auto">
                    <p className="w-20 text-md font-400 text-zinc-400 text-right">熱門程度</p>
                    <img src="/down.png" className="w-4 h-4" />
                </button>
            </div>
            <div id="tripWrapper" className="w-full mt-5 mb-5 flex flex-wrap gap-7 pl-2 pr-2">
                <HomeTripCard />
                <HomeTripCard />
                <HomeTripCard />
                <HomeTripCard />
                <HomeTripCard />
                <HomeTripCard />
                <HomeTripCard />
                <HomeTripCard />
            </div>
        </div>
    )

}
