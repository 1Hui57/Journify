import { AuthProvider } from "@/context/AuthContext";
import Header from "../component/Header";
import "../global.css";
import Footer from "@/component/Footer";
import { usePathname } from "next/navigation";
import { MapProvider } from "@/context/MapContext";


export const metadata = {
  title: 'Journify 旅雀',
  description: '安排你的旅遊行程！',
  icons: {
    icon: "/journify-logo.png", // 確保這個檔案存在於 `public` 資料夾內
  },

}

export default function RootLayout({ children }: { children: React.ReactNode }) {


  return (
    <html lang="en" className="h-full">
      <body className="h-full m-0">
        <AuthProvider>
          <MapProvider>
            <Header />
            <main className="pt-[60px] m-0">{children}</main>
            <Footer />
          </MapProvider>
        </AuthProvider>
      </body>
    </html>
  )
}