// app/layout.js
import "./globals.css";
import { dbConnect } from "@/services/mongo";
import AuthProvider from "./providers/AuthProvider";
import NavBar from "./components/NavBar";
import Script from "next/script";

export const metadata = {
  title: "Production Info App",
  description: "HKD Outdoor Innovation Ltd. Production Info App",
};

export default async function RootLayout({ children }) {
  await dbConnect();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ✅ Set theme before React loads to avoid flicker */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function () {
              try {
                const stored = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = stored ? stored === 'dark' : prefersDark;
                const root = document.documentElement;
                if (isDark) root.classList.add('dark');
                else root.classList.remove('dark');
              } catch (e) {}
            })();`}
        </Script>

        {/* (Optional) Google Fonts you shared */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&family=Stack+Sans+Headline:wght@200..700&display=swap"
          rel="stylesheet"
        />
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
