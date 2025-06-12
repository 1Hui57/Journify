'use client'
import { PublicTrip, SelectTripDay, Trip, TripDaySchedule } from '@/app/type/trip';
import SharingAttractionWrappwer from '@/component/sharingPageComponent/SharingAttractionWrapper';
import TripAttractionWrappwer from '@/component/TripAttractionWrapper';
import { db } from '@/lib/firebase';
import { collection, doc, getDoc, onSnapshot, query, Timestamp, where } from 'firebase/firestore';
import { useRouter, useParams } from 'next/navigation';
import { SetStateAction, useEffect, useRef, useState } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa6';

export default function SharingTripPage() {

    const router = useRouter();
    
    return(
        <div>分享</div>
    )
}