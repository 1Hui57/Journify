import { Timestamp } from "firebase/firestore";

export interface TripTime {
    tripFrom: Timestamp;
    tripTo: Timestamp;
}
export interface Trip {
    tripName: string;
    person: Number;
    tripTime: TripTime;
    isPublic: boolean;
    tripCountry: string;
    createAt: Timestamp;
    updateAt: Timestamp;
}
export interface Country {
    countryCode: string;
    countryName: string;
    lat: number;
    lng: number;
}
export interface TripScheduleItem {
    id: string;
    name: string;
    formatted_address: string;
    lat: number;
    lng: number;
    photo: string;
    startTime: Date;
    endTime: Date;
}
export interface TripDaySchedule {
    id: string;
    rawDate: Date;
    date: string;      // 格式：2025.05.12
    number: number;     // 例如：1
    data: TripScheduleItem[];
}

export interface Location {
  lat: number;
  lng: number;
}
export interface Place {
  id:string;
  place_id: string;
  name?: string;
  address?: string;
  location: Location;
  rating?: number;
  photos?: google.maps.places.PlacePhoto[];
  opening_hours?: google.maps.places.PlaceOpeningHours;
}