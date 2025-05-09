'use client'
import"../style.css"
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react';
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
        <div className='max-w-7xl w-full h-full  m-auto'>
            <div className='w-full h-65 p-3 flex'>
                <div className='bg-primary-300 h-full w-2/5 p-13 rounded-4xl flex flex-col '>
                    <h3 className='text-myblue-700'>開始規劃</h3>
                    <h1 className='text-myblue-700'>你的旅程</h1>
                    <button className='text-mywhite-100 bg-myblue-600 w-20 h-10 mt-5 self-end rounded-full'>START</button>
                </div>
                <div className='top__hotCounty h-full w-3/5 ' > </div>
            </div>
        </div>
    )

}
