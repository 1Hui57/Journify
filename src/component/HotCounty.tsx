export default function HotCounty(){
    return(
        <div className="relative w-1/4 min-w-35 h-full rounded-xl overflow-hidden flex justify-center items-center before:absolute before:inset-0 before:bg-black before:opacity-20 cursor-pointer">
            <p className="absolute text-white text-xl font-bold">大阪</p>
            <img src="/Osaka.jpg" className="w-full h-full object-cover" />
        </div>
    )
}