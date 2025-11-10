"use client";

import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";

export default function InspectionTopInput({ id, registerData = [] }) {
  const { auth } = useAuth();

  // pick this user's register row (created_by == auth.user_name)
  const userRegister = useMemo(() => {
    const name = auth?.user_name?.trim().toLowerCase();
    if (!name) return null;
    return registerData.find(
      (r) => r?.created_by?.trim().toLowerCase() === name
    );
  }, [auth, registerData]);

  const fields = [
    { label: "Building", value: userRegister?.building },
    { label: "Floor",    value: userRegister?.floor },
    { label: "Line",     value: userRegister?.line },
    { label: "Buyer",    value: userRegister?.buyer },
    { label: "Style",    value: userRegister?.style },
    { label: "Item",     value: userRegister?.item },
    { label: "Color",    value: userRegister?.color },
  ];

  return (
    <header className="w-full sticky top-0 z-20">
      {/* Title */}
      <div className="mx-auto max-w-screen-2xl px-2 sm:px-4">
        <div className="mt-3 rounded-xl border border-gray-200 bg-indigo-200 backdrop-blur shadow-sm">
          <div className="px-3 py-2 text-center">
            <h1 className="text-[13px] sm:text-sm md:text-base font-semibold tracking-wide text-gray-900">
              Daily In Processed / End Line Inspection Report
            </h1>
          </div>

          {/* Field strip */}
          <div className="border-t border-gray-200">
            <div
              className="grid gap-0.5 p-1 sm:p-2"
              // auto-fit columns: each cell 140px+ and grows evenly
              style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
            >
              {fields.map((f) => (
                <div
                  key={f.label}
                  className="rounded-md border border-gray-300 bg-white shadow-[inset_0_0_0_1px_rgba(0,0,0,0.02)]"
                >
                  <div className="px-2 pt-1">
                    <span className="block text-[10px] sm:text-[11px] font-medium text-gray-600">
                      {f.label}
                    </span>
                  </div>
                  <div
                    className="mx-2 mb-2 mt-1 h-8 sm:h-9 rounded border border-gray-300 bg-white px-2 flex items-center
                               text-[11px] sm:text-sm font-semibold text-gray-900
                               overflow-hidden text-ellipsis whitespace-nowrap"
                    title={f.value || ""} // tooltip on hover with full value
                  >
                    {f.value || ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status messages (small, unobtrusive) */}
        {!auth && (
          <p className="mt-2 text-center text-[11px] text-red-600">
            Please log in to view your line information.
          </p>
        )}
        {auth && !userRegister && (
          <p className="mt-2 text-center text-[11px] text-yellow-700">
            No registered line info found for <b>{auth?.user_name}</b>.
          </p>
        )}
      </div>
    </header>
  );
}
