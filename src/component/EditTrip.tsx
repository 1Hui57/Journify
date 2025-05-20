'use client'
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';

interface TripTime {
    tripFrom: Date;
    tripTo: Date;
}
interface Trip {
    tripName: string;
    person: Number;
    tripTime: TripTime;
    isPublic: boolean;
    tripCountry: string;
    createAt: Timestamp;
    updateAt: Timestamp;
}
interface EditTripProps{
    trip:Trip|undefined;
}
export default function EditTrip({trip}:EditTripProps){


    return(
        <div className='w-full h-full bg-mywhite-100'>
            <div className='w-full h-16 px-5 text-2xl-700 border-amber-100 border-2 flex items-center'>{trip?.tripName}</div>
        </div>
    )
}