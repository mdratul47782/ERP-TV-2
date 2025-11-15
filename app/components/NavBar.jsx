"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import Image from "next/image";

export default function NavBar() {
  const pathname = usePathname() || "/";
  const { auth } = useAuth();

  // true = device supports hover (desktop/laptop mice, etc.)
  const [isHoverDevice, setIsHoverDevice] = useState(false);
  // start visible (mobile + desktop on first paint)
  const [isVisible, setIsVisible] = useState(true);

  // Detect if the device actually supports hover
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(hover: hover)");
    const updateHover = () => {
      setIsHoverDevice(mq.matches);
      // If it *does* support hover, start hidden until user moves to top
      if (mq.matches) {
        setIsVisible(false);
      } else {
        // No hover (mobile/tablet) → always visible
        setIsVisible(true);
      }
    };

    updateHover();
    mq.addEventListener("change", updateHover);

    return () => {
      mq.removeEventListener("change", updateHover);
    };
  }, []);

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
     ${
       active
         ? "bg-emerald-600 text-white shadow-sm"
         : "text-slate-700 hover:text-slate-900 hover:bg-black/5 dark:text-gray-300 dark:hover:text-white dark:hover:bg-white/10"
     }`;

  // 🔵 Base style for the auth button (Login/Logout)
  const baseAuthButtonClass = `
    px-3 py-1.5 rounded-md text-sm font-semibold shadow-sm
    focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400
  `;

  // ✅ Treat "logged in" as auth not null/undefined
  const isLoggedIn = auth !== null && auth !== undefined;

  // 🔁 Compute class based on auth state
  const authButtonClass = (active) => {
    if (isLoggedIn) {
      // Logout → red
      return `
        ${baseAuthButtonClass}
        ${active ? "bg-red-700 text-white" : "bg-red-600 text-white hover:bg-red-700"}
      `;
    }
    // Login → indigo
    return `
      ${baseAuthButtonClass}
      ${active ? "bg-indigo-700 text-white" : "bg-indigo-600 text-white hover:bg-indigo-700"}
    `;
  };

  // Translate logic:
  const navTranslateClass = !isHoverDevice
    ? "translate-y-0"
    : isVisible
    ? "translate-y-0"
    : "-translate-y-full";

  // Hover handlers only for hover devices (desktop)
  const hoverHandlers = isHoverDevice
    ? {
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
      }
    : {};

  return (
    <>
      {/* Hover strip only for devices that actually support hover */}
      {isHoverDevice && (
        <div
          className="fixed top-0 left-0 right-0 h-2 z-[40]"
          onMouseEnter={() => setIsVisible(true)}
        />
      )}

      <nav
        role="navigation"
        aria-label="Primary"
        {...hoverHandlers}
        className={`
          fixed top-0 left-0 right-0 z-50
          transform transition-transform duration-300
          ${navTranslateClass}
          border-b border-slate-200/60 bg-white/70 backdrop-blur
          dark:border-white/10 dark:bg-black/70
          shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_-1px_0_rgba(255,255,255,0.08)]
        `}
      >
        <div className="mx-auto max-w-7xl px-3 md:px-4">
          <div className="flex min-h-14 items-center justify-between gap-3 flex-wrap py-1">
            {/* Brand */}
            <Link
              href={PATHS.home}
              className="group flex items-center gap-2 rounded-md p-1.5
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label="HKD Home"
            >
              <Image
                src="/ChatGPT Image Nov 14, 2025, 08_47_05 PM.png"
                alt="HKD Outdoor Innovations Ltd. Logo"
                width={30}
                height={30}
                className="rounded-md bg-amber-50"
                priority
              />
              <span className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white md:text-lg">
                HKD
              </span>
            </Link>

            {/* Center links */}
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

            {/* Right side: user chip + Login/Logout button */}
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 md:flex">
                <span className="material-symbols-outlined text-base text-slate-600 dark:text-gray-300">
                  person
                </span>
                <span
                  className="rounded-md border border-black/10 bg-black/[0.03] px-2 py-1 text-xs text-slate-900
                                 dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  {auth?.user_name ?? "Guest"}
                </span>
              </div>

              {/* Login / Logout button */}
              <Link
                href={PATHS.login}
                className={authButtonClass(isActive(PATHS.login))}
                aria-current={isActive(PATHS.login) ? "page" : undefined}
              >
                {isLoggedIn ? "Logout" : "Login"}
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
