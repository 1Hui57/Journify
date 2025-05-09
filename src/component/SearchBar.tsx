export default function SearchBar(){
    return(
        <div className="w-full h-[50px]  min-h-[50px] mt-2  md:mt-3 rounded-full shadow-lg bg-mywhite-100 border-zinc-300 flex items-center gap-3 pl-5">
            <img src="/search.png" alt="" className="w-5 h-5"/>
            <input type="text" placeholder="查詢 景點 或 旅程關鍵字" className="text-md w-full font-bold text-zinc-800"/>
        </div>
    )
}