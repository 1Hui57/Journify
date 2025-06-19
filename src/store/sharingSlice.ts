'use client';
import { ReduxTripScheduleItem, TripScheduleItem } from "@/app/type/trip";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface SharingState {
  showNotePopup: boolean;
  editingItemId: string | null;
  editingTripItem:ReduxTripScheduleItem|null;
  showEditTimePopup:boolean;
  selectedAttractionId:string |null;
}

const initialState: SharingState = {
  showNotePopup: false,
  editingItemId: null,
  editingTripItem:null,
  showEditTimePopup:false,
  selectedAttractionId:null,
};

export const sharingSlice = createSlice({
  name: "sharing",
  initialState,
  reducers: {
    setShowNotePopup: (state, action: PayloadAction<boolean>) => {
      state.showNotePopup = action.payload;
    },
    setEditingItemId: (state, action: PayloadAction<string | null>) => {
      state.editingItemId = action.payload;
    },
    resetEditing: (state) => {
      state.editingItemId = null;
      state.showNotePopup = false;
    },
    setEditingTripItem: (state, action : PayloadAction<ReduxTripScheduleItem | null>) => {
        state.editingTripItem = action.payload;
    },
    setShowEditTimePopup:(state, action:PayloadAction<boolean>)=>{
        state.showEditTimePopup=action.payload;
    },
    setSelectedAttractionId:(state, action:PayloadAction<string |null>)=>{
        state.selectedAttractionId=action.payload;
    }
  },
});

export const { setShowNotePopup, setEditingItemId, resetEditing, setEditingTripItem, setShowEditTimePopup, setSelectedAttractionId } = sharingSlice.actions;
export default sharingSlice.reducer;