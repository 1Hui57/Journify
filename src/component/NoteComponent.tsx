'use client'

import { Place, SelectTripDay, TripScheduleItem } from '@/app/type/trip';
import { Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { RxCross2 } from "react-icons/rx";
interface NoteComponentProps {
    EditTripScheduleItemId:string|null;
}

export default function NoteComponent({EditTripScheduleItemId  }: NoteComponentProps) {


    return (
        <div className='relative w-72 h-56 bg-mywhite-100 text-myblue-600 flex flex-col p-3 rounded-md shadow-2xl'>
            <RxCross2 className='absolute top-2 right-2 w-5 h-5' />
            <div className='w-fit text-lg-700 text-myblue-600 mb-5 mx-auto'>
                {}
            </div>
            <button className=' p-2 text-base-500 text-primary-300 bg-myblue-400 rounded-md hover:text-primary-300 hover:bg-myblue-700'>確認加入</button>
        </div>
    );
}




