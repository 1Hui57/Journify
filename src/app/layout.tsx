
import { AuthProvider } from "@/context/AuthContext";
import Header from "../component/Header";
import "../global.css";


export const metadata = {
  title: 'Journify 旅雀',
  description: '安排你的旅遊行程！',
  icons: {
    icon: "/journify-logo.png", // 確保這個檔案存在於 `public` 資料夾內
  },

}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
            <Header />
            <main className="w-full h-full pt-[60px] m-0">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}