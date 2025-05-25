'use client'
import React, { useEffect, useState } from "react";


interface Country {
    countryCode: string;
    countryName: string;
    lat: number;
    lng: number;
}
interface CountrySelect {
    setTripCountry: React.Dispatch<React.SetStateAction<string>>;
}
export default function CountrySelect({ setTripCountry }: CountrySelect) {

    const [countries, setCountries] = useState<Country[]>([]);
    const [searchWord, setSearchWord] = useState<string>("");
    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [resultCountries, setResultCountries] = useState<Country[]>(
        [{
            countryCode: "no",
            countryName: "查無資料",
            lat: 0,
            lng: 0,
        }]
    );

    // 載入countries.json
    useEffect(() => {
        fetch("/countries.json")
            .then((response) => response.json())
            .then((data) => setCountries(data))
            .catch((error) => console.log("載入國家失敗ˇ"));
    }, []);

    // 根據搜尋字串過濾國家
    function selectCountry(searchWord: string) {
        const filteredCountries = countries.filter((country) =>
            country.countryName.includes(searchWord)
        );
        if (filteredCountries.length < 1) {
            setResultCountries([{
                countryCode: "no", countryName: "查無資料", lat: 0, lng: 0
            }]);
            return;
        }
        setResultCountries(filteredCountries);
    }

    // 點擊選單帶入input
    function handleClick(country: string) {
        setSearchWord(country);
        setIsSelecting(false);
        setTripCountry(country);
    }


    return (
        <div className="relative w-full min-h-10 h-fit mt-1 mb-2 flex flex-col ">
            <input type="text" placeholder="請輸入旅程國家" value={searchWord} onChange={(e) => { setSearchWord(e.target.value); selectCountry(e.target.value); setIsSelecting(true) }}
                className="h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2" />
            {isSelecting && searchWord.trim() !== "" && (
                <ul className="absolute z-100 top-10 w-full h-fit bg-mywhite-100 border-1 border-myzinc-300 rounded-sm mt-0.5 shadow">
                    {resultCountries[0].countryCode === "no" ? (
                        <li onClick={() => { setIsSelecting(false); setSearchWord(""); setTripCountry(""); }} className="pl-2 h-10 border-b-1 border-myzinc-300 flex items-center hover:bg-myzinc-100 cursor-pointer">
                            查無國家
                        </li>
                    )
                        : resultCountries.map((country) => (
                            <li key={country.countryCode} onClick={() => handleClick(country.countryName)} className="pl-2 h-10 border-b-1 border-myzinc-300 flex items-center hover:bg-myzinc-100 cursor-pointer">
                                {country.countryName}
                            </li>
                        ))}
                </ul>
            )}
        </div>
    )
}