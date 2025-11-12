// app/layout.js
import "./globals.css";
import { dbConnect } from "@/services/mongo";
import AuthProvider from "./providers/AuthProvider";
import NavBar from "./components/NavBar";
import Script from "next/script";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],        // Extra Bold
  display: "swap",
  variable: "--font-poppins",
});

export const metadata = {
  title: "Production Info App",
  description: "HKD Outdoor Innovation Ltd. Production Info App",
};

export default async function RootLayout({ children }) {
  await dbConnect();

  return (
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">{`(function(){try{const s=localStorage.getItem('theme');const p=window.matchMedia('(prefers-color-scheme: dark)').matches;const isDark=s?s==='dark':p;const r=document.documentElement;if(isDark)r.classList.add('dark');else r.classList.remove('dark')}catch(e){}})();`}</Script>
        {/* Remove the <link> tags to Google Fonts if using next/font */}
      </head>
      <body className="antialiased">
        <AuthProvider>
          <NavBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
