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
            <div className='w-full h-20 pt-8 flex text-3xl font-extrabold text-myblue-700'>
                Journify幫你輕鬆安排行程
            </div>
            <p className="text-zinc-500">超過 38,512 人都在使用的排程網站</p>
            <div className='w-full h-full md:h-64 flex flex-col md:flex-row mt-5 gap-5'>
                <div className='bg-primary-300 h-full w-full md:w-2/5 p-12 rounded-4xl flex flex-col'>
                    <h3 className='text-myblue-700'>開始規劃</h3>
                    <h1 className='text-myblue-700'>你的旅程</h1>
                    <button className='text-mywhite-100 bg-myblue-600 w-20 h-10 mt-8 self-end rounded-full font-bold'>START</button>
                </div>
                <div className='h-full w-full md:w-3/5 flex flex-col'>
                    <h2 className="text-myblue-700 h-[80px] flex items-center">熱門城市</h2>
                    <div id="hotCounty" className="w-full h-full flex gap-x-4 overflow-x-auto">
                        <HotCounty />
                        <HotCounty />
                        <HotCounty />
                        <HotCounty />
                    </div>
                </div>
            </div>
            <SearchBar />
            <button className="w-fit self-end mt-3 flex items-center gap-2 pr-2">
                <p className="w-full text-md font-400 text-zinc-400 text-right">熱門程度</p>
                <img src="/down.png" className="w-4 h-4" />
            </button>
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
