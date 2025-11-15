// app/layout.js
import "./globals.css";
import { dbConnect } from "@/services/mongo";
import AuthProvider from "./providers/AuthProvider";
import ProductionAuthProvider from "./providers/ProductionAuthProvider";
import NavBar from "./components/NavBar";
import Script from "next/script";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600"],
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
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=person"
        />
      </head>
      <body className="antialiased">
        <ProductionAuthProvider>
          <AuthProvider>
            <NavBar />
            {children}
          </AuthProvider>
        </ProductionAuthProvider>
      </body>
    </html>
  );
}
