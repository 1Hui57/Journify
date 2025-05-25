'use client'

import { Place, SelectTripDay, TripScheduleItem } from '@/app/type/trip';
import { Timestamp } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { RxCross2 } from "react-icons/rx";
// redux
import { useDispatch } from "react-redux";
import { setShowNotePopup, setEditingItemId } from "@/store/tripSlice"
import { useSelector } from "react-redux";
import { TripEditRootState } from '@/store/tripEditStore';

interface NoteComponentProps {
    // EditTripScheduleItemId: string | null;
    editAttractionNote: (dayId: string, tripScheduleItemId: string, note: string) => void;
    selectedDay: SelectTripDay;
}

export default function NoteComponent({ editAttractionNote, selectedDay }: NoteComponentProps) {

    const dispatch = useDispatch();
    const editingTripItem = useSelector(
        (state: TripEditRootState) => state.tripEdit.editingTripItem
    );

    // 用 useState 存筆記內容，初始值為 redux 裡的 note
    const [note, setNote] = useState('');

    // 每次選到新的項目就更新 textarea 的內容
    useEffect(() => {
        setNote(editingTripItem?.note || '');
    }, [editingTripItem]);

    return (
        <div className='relative w-72 h-56 bg-mywhite-100 text-myblue-600 flex flex-col p-3 rounded-md shadow-2xl'>
            <RxCross2 className='absolute top-2 right-2 w-5 h-5' onClick={() => { dispatch(setShowNotePopup(false)); }} />
            <div className='w-full h-full text-base-700 text-myblue-600 mx-auto mb-2 flex flex-col gap-1'>
                <p>{editingTripItem?.name}</p>
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder='請輸入筆記' className='w-full h-full p-2 resize-none text-sm-400 border-1 border-myblue-400' ></textarea>
            </div>
            <button onClick={() => {
                if (!editingTripItem || !editingTripItem.id) return;
                editAttractionNote(selectedDay.id, editingTripItem.id, note);
                dispatch(setShowNotePopup(false));
                setNote("");
            }}
                className='w-full h-12 p-2 text-base-500 text-primary-300 bg-myblue-400 rounded-md hover:text-primary-300 hover:bg-myblue-700'>更新筆記</button>
        </div>
    );
}




