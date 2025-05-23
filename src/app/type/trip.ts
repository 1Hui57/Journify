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
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  photo: string;
  startTime?: Timestamp;
  endTime?: Timestamp;
  note?: string;
}
type TripTransport = {
  id: string; //自動生成的流水號
  fromAttractionId: string; //上面景點的id(非place_id)
  toAttractionId: string; //下面景點的id(非place_id)
  fromAttractionPlaceId: string; //上面景點的place_id
  toAttractionPlaceId: string; //上面景點的place_id
  duration: number; // 使用者輸入的持續時間
  mode: string;
  note?: string;
};
export interface TripDaySchedule {
  id: string;
  rawDate: Date;
  date: string; // 格式：2025.05.12
  number: number; // 例如：1
  attractionData: TripScheduleItem[];
  transprotData: TripTransport[];
}
export interface Location {
  lat: number;
  lng: number;
}
export interface Place {
  id: string;
  place_id: string;
  name?: string;
  address?: string;
  location: Location;
  rating?: number;
  photos?: google.maps.places.PlacePhoto[];
  opening_hours?: google.maps.places.PlaceOpeningHours;
}
export interface SelectTripDay {
  id: string;
  date: Date | null;
}
