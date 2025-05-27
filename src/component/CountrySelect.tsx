'use client'
import { Country } from "@/app/type/trip";
import React, { useEffect, useState } from "react";


interface CountrySelectProps {
  selectedCountries: Country[];
  setSelectedCountries: React.Dispatch<React.SetStateAction<Country[]>>;
}

export default function CountrySelect({
  selectedCountries,
  setSelectedCountries,
}: CountrySelectProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [searchWord, setSearchWord] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState<boolean>(false);
  const [resultCountries, setResultCountries] = useState<Country[]>([]);

  useEffect(() => {
    fetch("/countries.json")
      .then((response) => response.json())
      .then((data) => setCountries(data))
      .catch((error) => console.log("載入國家失敗"));
  }, []);

  function selectCountry(word: string) {
    const filtered = countries.filter((country) =>
      country.countryName.includes(word)
    );
    setResultCountries(filtered.length ? filtered : []);
  }

  function handleAddCountry(country: Country) {
    // 避免重複選取
    if (selectedCountries.find((c) => c.countryCode === country.countryCode)) return;
    setSelectedCountries([...selectedCountries, country]);
    setSearchWord("");
    setIsSelecting(false);
  }

  function handleRemoveCountry(code: string) {
    setSelectedCountries(selectedCountries.filter((c) => c.countryCode !== code));
  }

  return (
    <div className="relative w-full min-h-10 h-fit mt-1 mb-2 flex flex-col">
      <input
        type="text"
        placeholder="請輸入旅程國家"
        value={searchWord}
        onChange={(e) => {
          setSearchWord(e.target.value);
          selectCountry(e.target.value);
          setIsSelecting(true);
        }}
        className="h-10 pl-2 border-1 border-myzinc-500 focus:border-myblue-300 focus:border-2"
      />

      {isSelecting && searchWord.trim() !== "" && (
        <ul className="absolute z-100 top-10 w-full h-fit bg-mywhite-100 border-1 border-myzinc-300 rounded-sm mt-0.5 shadow">
          {resultCountries.length === 0 ? (
            <li
              onClick={() => {
                setIsSelecting(false);
                setSearchWord("");
              }}
              className="pl-2 h-10 border-b-1 border-myzinc-300 flex items-center text-myzinc-400 cursor-default"
            >
              查無國家
            </li>
          ) : (
            resultCountries.map((country) => (
              <li
                key={country.countryCode}
                onClick={() => handleAddCountry(country)}
                className="pl-2 h-10 border-b-1 border-myzinc-300 flex items-center hover:bg-myzinc-100 cursor-pointer"
              >
                {country.countryName}
              </li>
            ))
          )}
        </ul>
      )}

      {/* 顯示已選擇的國家 */}
      {selectedCountries.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedCountries.map((country) => (
            <div key={country.countryCode} className="flex items-center bg-myblue-100 text-myblue-700 px-2 py-1 rounded">
              {country.countryName}
              <button
                onClick={() => handleRemoveCountry(country.countryCode)}
                className="ml-2 text-sm text-mywhite-200 hover:text-red-300"
              >
                ❌
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}