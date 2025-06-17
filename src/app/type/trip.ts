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
  tripCountry: Country[];
  createAt: Timestamp;
  updateAt: Timestamp;
  tripDaySchedule?: TripDaySchedule[] | null;
}
export interface PublicTrip {
  userId: string;
  tripId: string;
  tripName: string;
  person: number;
  tripTime: TripTime;
  isPublic: boolean;
  tripCountry: Country[];
  countryCodes: string[]; //["JP","TW"]
  createAt: Timestamp;
  updateAt: Timestamp;
  likeCount: number;
}
export interface Country {
  countryCode: string;
  countryName: string;
  lat: number;
  lng: number;
  photoURL?: string;
}
export interface TripDaySchedule {
  id: string;
  rawDate: Date;
  date: string; // 格式：06月02日
  number: number; // 例如：1
  attractionData: TripScheduleItem[];
  transportData: TripTransport[];
}
export interface TripScheduleItem {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  photo: string | null;
  startTime?: Timestamp;
  endTime?: Timestamp;
  timeStamp?: Timestamp; //用以檢查圖片是否過期，超過兩天需重打API取得新圖片
  note?: string;
}
export interface ReduxTripScheduleItem {
  id: string;
  place_id: string;
  name: string;
  formatted_address: string;
  lat: number;
  lng: number;
  photo: string | null;
  startTime?: number;
  endTime?: number;
  timeStamp?: number;
  note?: string;
}
export interface TripTransport {
  id: string; //自動生成的流水號
  fromAttractionId: string; //上面景點的id(非place_id)
  toAttractionId: string; //下面景點的id(非place_id)
  fromAttractionPlaceId: string; //上面景點的place_id
  toAttractionPlaceId: string; //上面景點的place_id
  selectedMode: string; //預設為開車
  modeOption?: TransportMode[];
  customDuration: number | null; // 使用者輸入的持續時間
  note?: string;
}
export interface TransportMode {
  mode: "WALKING" | "DRIVING" | "TRANSIT";
  duration: number | null; // 單位為秒
  distance: number | null; // 單位為公尺
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
  photos?: string | undefined;
  opening_hours?: google.maps.places.PlaceOpeningHours;
}
export interface SelectTripDay {
  id: string;
  date: Date | null;
}
export interface TansportData {
  duration: number;
  distance: number;
}
