"use client";

import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";

export default function InspectionTopInput({
  className = "",
  id,
  registerData = [],
  theme = "dark", // "dark" (glassy) | "light" (white card)
}) {
  const { auth } = useAuth();

  const userRegister = useMemo(() => {
    const name = auth?.user_name?.trim()?.toLowerCase();
    if (!name) return null;
    return registerData.find(
      (r) => r?.created_by?.trim()?.toLowerCase() === name
    );
  }, [auth, registerData]);

  const fields = [
    { label: "Building", value: userRegister?.building },
    { label: "Floor", value: userRegister?.floor },
    { label: "Line", value: userRegister?.line },
    { label: "Buyer", value: userRegister?.buyer },
    { label: "Style", value: userRegister?.style },
    { label: "Style/Item", value: userRegister?.item },
    { label: "Color/Model", value: userRegister?.color },
  ];

  const isLight = theme === "light";

  return (
    <header className={`w-full z-20 ${className}`}>
      <div className="mx-auto max-w-screen-3xl">
        {/* Container switches by theme */}
        <div
          className={
            isLight
              ? "relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
              : "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md"
          }
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3
              className={
                isLight
                  ? "text-sm font-bold uppercase tracking-wider text-slate-900"
                  : "text-sm font-bold uppercase tracking-wider text-white/90"
              }
            >
              Line Information
            </h3>
            <div
              className={
                isLight
                  ? "rounded-md bg-gray-100 px-2 py-0.5 text-[10px] text-slate-700"
                  : "rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/70"
              }
            >
              {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* Chips */}
          <div className="py-2">
            <ul className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 px-2">
              {fields.map((f) => (
                <li
                  key={f.label}
                  className={
                    isLight
                      ? "flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 shadow-sm text-center"
                      : "flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-1.5 shadow-sm text-center"
                  }
                  title={f.value || ""}
                >
                  <span
                    className={
                      isLight
                        ? "text-[11px] sm:text-xs lg:text-sm text-slate-600 font-semibold tracking-wider"
                        : "text-[11px] sm:text-xs lg:text-sm text-white/70 font-semibold tracking-wider"
                    }
                  >
                    {f.label}:
                  </span>
                  <span
                    className={
                      isLight
                        ? "text-sm sm:text-base lg:text-lg font-semibold text-slate-900 max-w-[12rem] sm:max-w-[16rem] lg:max-w-[22rem] truncate"
                        : "text-sm sm:text-base lg:text-lg font-semibold text-white/90 max-w-[12rem] sm:max-w-[16rem] lg:max-w-[22rem] truncate"
                    }
                  >
                    {f.value || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Status messages */}
        {!auth && (
          <p
            className={
              isLight
                ? "mt-1 text-center text-[12px] sm:text-sm text-red-600"
                : "mt-1 text-center text-[12px] sm:text-sm text-red-300"
            }
          >
            Please log in to view your line information.
          </p>
        )}
        {auth && !userRegister && (
          <p
            className={
              isLight
                ? "mt-1 text-center text-[12px] sm:text-sm text-yellow-700"
                : "mt-1 text-center text-[12px] sm:text-sm text-yellow-200"
            }
          >
            No registered line info found for <b className={isLight ? "text-slate-900" : "text-white/90"}>{auth?.user_name}</b>.
          </p>
        )}
      </div>
    </header>
  );
}
