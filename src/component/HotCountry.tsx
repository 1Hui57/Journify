'use client'

import { Country } from "@/app/type/trip";
import { useRouter } from 'next/navigation'
import { useEffect, useState } from "react";

interface HotCountry {
    code: string;
    name: string;
    count: number;
}
interface HotCountryProps {
    hotCountry: HotCountry;
}
export default function HotCountry({ hotCountry }: HotCountryProps) {

    const router = useRouter();

    const [countries, setCountries] = useState<Country[]>([]);

    // 載入國家資料
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.error("載入國家失敗", error));
    }, []);

    const countryURL = countries.find(item => item.countryCode === hotCountry.code)?.photoURL;

    return (
        <div onClick={() => { router.push(`/Country/${hotCountry.code}`) }}
            className="relative w-1/4 min-w-35 h-full rounded-xl overflow-hidden flex justify-center items-center before:absolute before:inset-0 before:bg-black before:opacity-20 cursor-pointer">
            <p className="absolute text-white text-xl font-bold">{hotCountry.name}</p>
            <img src={countryURL || "/hotCountry.jpg"} className="w-full h-full object-cover" />
        </div>
    )
}