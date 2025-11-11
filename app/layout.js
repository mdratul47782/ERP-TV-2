// app/layout.js
import "./globals.css";
import { dbConnect } from "@/services/mongo";
import AuthProvider from "./providers/AuthProvider";
import NavBar from "./components/NavBar";
import Link from "next/link";

export const metadata = {
  title: "Production Info App",
  description: "HKD Outdoor Innovation Ltd. Production Info App",
};

export default async function RootLayout({ children }) {
  await dbConnect();

  return (
    <html lang="en">
      <head>
        {/* ✅ Roboto Condensed + Stack Sans Headline */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <Link
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
