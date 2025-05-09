import Header from "../component/Header";
import "../global.css";


export const metadata = {
  title: 'Journify 旅雀',
  description: '安排你的旅遊行程！',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="w-full h-full">{children}</main>
      </body>
    </html>
  )
}