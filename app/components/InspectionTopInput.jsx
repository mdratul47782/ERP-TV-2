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
    <div className="w-full">
      {/* Title bar */}
      <div className="w-full text-center font-semibold text-sm md:text-base text-black">
        Daily In Processed/End Line Inspection Report
      </div>

      {/* Thin, single-row band with seven boxes */}
      <div className="mt-1 border border-gray-300 rounded-md overflow-hidden">
        <div className="grid"
             style={{
               gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
             }}
        >
          {fields.map((f) => (
            <div key={f.label} className="border border-gray-300">
              <div className="text-[10px] md:text-xs text-gray-600 px-1 pt-0.5">
                {f.label}
              </div>
              <div className="h-7 md:h-8 mx-1 mb-1 rounded-sm border border-gray-400 bg-white px-1
                              flex items-center text-[11px] md:text-sm text-gray-900">
                {f.value || ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional: small helper when not logged in / no data */}
      {!auth && (
        <div className="mt-2 text-[11px] text-red-600 text-center">
          Please log in to view your line information.
        </div>
      )}
      {auth && !userRegister && (
        <div className="mt-2 text-[11px] text-yellow-700 text-center">
          No registered line info found for <b>{auth.user_name}</b>.
        </div>
      )}
    </div>
  );
}
