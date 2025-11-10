"use client";

import React from "react"; // ✅ Required for <React.Fragment>
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";


export default function TopThreeDefects({ hourlyData = [] }) {
  const { auth } = useAuth();

  if (!auth) {
    return (
      <div className="text-center text-red-600 font-medium mt-4">
        ⚠️ Please log in to view top defect summary.
      </div>
    );
  }

  // ✅ Filter user-specific hourly data
  const userHourlyData = useMemo(() => {
    return hourlyData.filter(
      (h) => h?.user?.user_name === auth.user_name
    );
  }, [hourlyData, auth.user_name]);

  // ✅ Flatten all defects
  const allDefects = useMemo(() => {
    const defectMap = {};
    let totalInspected = 0;

    userHourlyData.forEach((entry) => {
      totalInspected += entry?.inspectedQty ?? 0;
      (entry.selectedDefects || []).forEach((defect) => {
        if (!defectMap[defect.name]) {
          defectMap[defect.name] = { quantity: 0 };
        }
        defectMap[defect.name].quantity += defect.quantity || 0;
      });
    });

    // Convert to array
    const defectArray = Object.entries(defectMap).map(([name, { quantity }]) => ({
      name,
      quantity,
      percentage: totalInspected
        ? ((quantity / totalInspected) * 100).toFixed(2)
        : "0.00",
    }));

    // Sort by quantity desc and return top 3
    return defectArray.sort((a, b) => b.quantity - a.quantity).slice(0, 3);
  }, [userHourlyData]);

  if (allDefects.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-4">
        No defect data available to calculate top 3 defects.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      {/* Header */}
      <div className="bg-red-700 text-white text-center text-sm font-bold py-1 rounded-t-md">
        TOP THREE (3) DEFECTS
      </div>

      {/* Table layout */}
      <div className="grid grid-cols-4 text-center text-white text-xs font-semibold">
        {/* Table header row */}
        <div className="bg-red-600 border border-white py-2">RANK</div>
        <div className="bg-red-600 border border-white py-2">DEFECT NAME</div>
        <div className="bg-red-600 border border-white py-2">DEFECT QUANTITY</div>
        <div className="bg-red-600 border border-white py-2">DEFECT %</div>

        {/* Data rows */}
        {allDefects.map((defect, index) => (
          <React.Fragment key={index}>
            <div className="bg-red-500 border border-white py-2">
              #{index + 1}
            </div>
            <div className="bg-red-500 border border-white py-2">
              {defect.name}
            </div>
            <div className="bg-red-500 border border-white py-2">
              {defect.quantity}
            </div>
            <div className="bg-red-500 border border-white py-2">
              {defect.percentage}%
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
