"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import Image from "next/image";

export default function NavBar() {
  const pathname = usePathname() || "/";
  const { auth } = useAuth();

  const PATHS = {
    home: "/",
    login: "/login",
    daily: auth?.id
      ? `/DailyInProcessedEndLineInspectionReport/${auth.id}`
      : "/login",
    hourly: "/HourlyProductionData",
    hourlyDashboard: "/HourlyDashboard",
    summary: "/QualitySummary",
  };

  const isActive = (href) => {
    if (href === "/") return pathname === "/";
    return pathname.toLowerCase().startsWith(href.toLowerCase());
  };

  const itemClass = (active) =>
    `px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition
     focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400
     ${active ? "bg-emerald-600 text-white shadow-sm"
              : "text-gray-300 hover:text-white hover:bg-white/10"}`;

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/10
                 bg-black/70 backdrop-blur supports-[backdrop-filter]:bg-black/60
                 shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]"
      role="navigation"
      aria-label="Primary"
    >
      <div className="mx-auto max-w-7xl px-3 md:px-4">
        {/* min-h to allow wrapping; remove fixed h-14 */}
        <div className="flex min-h-14 items-center justify-between gap-3 flex-wrap py-1">
          {/* Brand */}
          <Link
            href={PATHS.home}
            className="group flex items-center gap-2 rounded-md p-1.5
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
            aria-label="HKD Home"
          >
            <Image
              src="/1630632533544 (2).jpg"
              alt="HKD Logo"
              width={28}
              height={28}
              className="rounded-md ring-1 ring-white/10"
              priority
            />
            <span className="text-white font-extrabold tracking-tight text-base md:text-lg">
              HKD
            </span>
          </Link>

          {/* Center links — wrap instead of scroll; no scrollbar */}
          <ul className="flex flex-wrap items-center gap-1 md:gap-2">
            <li>
              <Link
                href={PATHS.home}
                className={itemClass(isActive(PATHS.home))}
                aria-current={isActive(PATHS.home) ? "page" : undefined}
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href={PATHS.login}
                className={itemClass(isActive(PATHS.login))}
                aria-current={isActive(PATHS.login) ? "page" : undefined}
              >
                Login
              </Link>
            </li>
            <li title={auth?.id ? "" : "Login required"}>
              <Link
                href={PATHS.daily}
                className={`${itemClass(
                  isActive("/DailyInProcessedEndLineInspectionReport")
                )} ${auth?.id ? "" : "opacity-60"}`}
                aria-current={
                  isActive("/DailyInProcessedEndLineInspectionReport")
                    ? "page"
                    : undefined
                }
              >
                Inspection Report
              </Link>
            </li>
            <li>
              <Link
                href={PATHS.hourly}
                className={itemClass(isActive(PATHS.hourly))}
                aria-current={isActive(PATHS.hourly) ? "page" : undefined}
              >
                Hourly Report
              </Link>
            </li>
            <li>
              <Link
                href={PATHS.hourlyDashboard}
                className={itemClass(isActive(PATHS.hourlyDashboard))}
                aria-current={
                  isActive(PATHS.hourlyDashboard) ? "page" : undefined
                }
              >
                Hourly Inspection Dashboard
              </Link>
            </li>
            <li>
              <Link
                href={PATHS.summary}
                className={itemClass(isActive(PATHS.summary))}
                aria-current={isActive(PATHS.summary) ? "page" : undefined}
              >
                Quality Summary
              </Link>
            </li>
          </ul>

          {/* User chip */}
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
