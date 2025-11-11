"use client";

import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";

export default function InspectionTopInput({ className = "", id, registerData = [] }) {
  const { auth } = useAuth();

  // pick this user's register row (created_by == auth.user_name)
  const userRegister = useMemo(() => {
    const name = auth?.user_name?.trim()?.toLowerCase();
    if (!name) return null;
    return registerData.find(
      (r) => r?.created_by?.trim()?.toLowerCase() === name
    );
  }, [auth, registerData]);

  const fields = [
    { label: "Building", value: userRegister?.building },
    { label: "Floor",    value: userRegister?.floor },
    { label: "Line",     value: userRegister?.line },
    { label: "Buyer",    value: userRegister?.buyer },
    { label: "Style",    value: userRegister?.style },
    { label: "Style/Item", value: userRegister?.item },
    { label: "Color/Model", value: userRegister?.color },
  ];

  return (
    <header className={`w-full z-20 ${className}`}>
      <div className="mx-auto max-w-screen-3xl">
        <div className="mt-2 rounded-xl border border-gray-300 bg-gradient-to-r from-indigo-50 to-sky-50 shadow-sm">
          {/* Centered, TV-friendly strip */}
          <div className="py-2">
            <ul className="flex flex-wrap justify-center items-center gap-2 lg:gap-3 px-2">
              {fields.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white/95 px-4 py-2 shadow-sm text-center"
                  title={f.value || ""}
                >
                  <span className="text-xs sm:text-sm lg:text-base text-gray-600 font-medium tracking-wide">
                    {f.label}:
                  </span>
                  <span
                    className="text-sm sm:text-base lg:text-xl font-semibold text-gray-900 max-w-[12rem] sm:max-w-[16rem] lg:max-w-[22rem] truncate"
                  >
                    {f.value || "—"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Compact status messages */}
        {!auth && (
          <p className="mt-1 text-center text-[12px] sm:text-sm text-red-600">
            Please log in to view your line information.
          </p>
        )}
        {auth && !userRegister && (
          <p className="mt-1 text-center text-[12px] sm:text-sm text-yellow-700">
            No registered line info found for <b>{auth?.user_name}</b>.
          </p>
        )}
      </div>
    </header>
  );
}
