"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";

export default function NavBar() {
  const pathname = usePathname();
  const { auth } = useAuth();

  const PATHS = {
    home: "/",
    login: "/login",
    daily: auth?.id
      ? `/DailyInProcessedEndLineInspectionReport/${auth.id}`
      : "/login",
    hourly: "/HourlyProductionData",
    hourlyDashboard: "/HourlyDashboard", // <-- NEW
    summary: "/QualitySummary",
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.toLowerCase().startsWith(href.toLowerCase());
  };

  const itemClass = (active) =>
    `px-3 py-2 rounded-lg text-sm font-semibold transition
     ${active ? "bg-emerald-600 text-white" : "text-gray-300 hover:text-white hover:bg-white/10"}`;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/70 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 md:px-4">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Brand / left */}
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-emerald-500/20 ring-1 ring-emerald-500/40" />
            <span className="hidden md:inline text-white font-extrabold tracking-tight">
              HKD 
            </span>
          </div>

          {/* Center links */}
          <ul className="flex items-center gap-1 md:gap-2">
            <li>
              <Link href={PATHS.home} className={itemClass(isActive(PATHS.home))}>
                Home
              </Link>
            </li>
            <li>
              <Link href={PATHS.login} className={itemClass(isActive(PATHS.login))}>
                Login
              </Link>
            </li>
            <li title={auth?.id ? "" : "Login required"}>
              <Link
                href={PATHS.daily}
                className={`${itemClass(isActive("/DailyInProcessedEndLineInspectionReport"))} ${auth?.id ? "" : "opacity-60"}`}
              >
                Daily In Processed End Line Inspection Report
              </Link>
            </li>
            <li>
              <Link href={PATHS.hourly} className={itemClass(isActive(PATHS.hourly))}>
                Hourly Report
              </Link>
            </li>
            <li>
              <Link
                href={PATHS.hourlyDashboard}
                className={itemClass(isActive(PATHS.hourlyDashboard))}
              >
                Hourly Dashboard
              </Link>
            </li>
            <li>
              <Link href={PATHS.summary} className={itemClass(isActive(PATHS.summary))}>
                Quality Summary
              </Link>
            </li>
          </ul>

          {/* Right: user chip */}
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-gray-400">User</span>
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs text-white">
              {auth?.user_name ?? "Guest"}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
