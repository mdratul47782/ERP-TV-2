"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function TopThreeDefects({ hourlyData = [] }) {
  const { auth } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!auth) {
    return (
      <div className="text-center text-red-600 font-medium mt-4">
        ⚠️ Please log in to view top defect summary.
      </div>
    );
  }

  // Get today's date at midnight for comparison
  const todayStart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, [refreshKey]); // Recalculate on refresh to handle day changes

  const todayEnd = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }, [refreshKey]);

  // Filter for current day and current user based on reportDate
  const todayUserData = useMemo(() => {
    return hourlyData.filter((h) => {
      if (h?.user?.user_name !== auth.user_name) return false;
      
      // Use reportDate for filtering
      if (!h.reportDate) return false;
      
      const reportDate = new Date(h.reportDate.$date || h.reportDate);
      return reportDate >= todayStart && reportDate <= todayEnd;
    });
  }, [hourlyData, auth.user_name, todayStart, todayEnd, refreshKey]);

  // Calculate top 3 defects
  const topDefects = useMemo(() => {
    const defectMap = {};
    let totalInspected = 0;

    todayUserData.forEach((entry) => {
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
  }, [todayUserData, refreshKey]);

  if (topDefects.length === 0) {
    return (
      <div className="text-center text-gray-500 mt-4">
        No defect data available for today.
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-3">
      {/* Header */}
      <div className="bg-red-700 text-white text-center text-sm font-bold py-1 rounded-t-md flex justify-between items-center px-4">
        <span>TOP THREE (3) DEFECTS - TODAY</span>
        <span className="text-xs font-normal">
          {new Date().toLocaleDateString()}
        </span>
      </div>

      {/* Table layout */}
      <div className="grid grid-cols-4 text-center text-white text-xs font-semibold">
        {/* Table header row */}
        <div className="bg-red-600 border border-white py-2">RANK</div>
        <div className="bg-red-600 border border-white py-2">DEFECT NAME</div>
        <div className="bg-red-600 border border-white py-2">DEFECT QUANTITY</div>
        <div className="bg-red-600 border border-white py-2">DEFECT %</div>

        {/* Data rows */}
        {topDefects.map((defect, index) => (
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