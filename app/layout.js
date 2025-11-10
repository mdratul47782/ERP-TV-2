import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { dbConnect } from "@/services/mongo";
import AuthProvider from "./providers/AuthProvider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Production Info App",
  description: "HKD Outdoor Innovation Ltd. Production Info App",
};

export default  async function RootLayout({ children }) {
  await dbConnect();
  return (
    <html lang="en">
      
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      ><AuthProvider>
        {children}
        </AuthProvider>
      </body>
      
    </html>
  );
}
