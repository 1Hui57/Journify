'use client'

import { TripTransport } from "@/app/type/trip";

interface TransportProps{
    tripTransport:TripTransport;
}
export default function TripTransportItem({tripTransport}:TransportProps) {

    return (
        <div  className="w-fit h-12 border-l-4 border-dashed border-myblue-300  ml-8  mb-2 flex items-center">
            <div className="w-fit">交通</div>
        </div>
    )
}