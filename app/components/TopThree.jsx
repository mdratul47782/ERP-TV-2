"use client";

import React, { useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function TopThreeDefects({ hourlyData = [] }) {
  const { auth } = useAuth();

  // 📅 Selected date (defaults to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // 🚫 If user not logged in
  if (!auth) {
    return (
      <div className="mt-4 text-center font-medium text-red-600">
        ⚠️ Please log in to view top defect summary.
      </div>
    );
  }

  // 🔐 Safe user name
  const userName =
    auth?.user_name || auth?.user?.user_name || auth?.user?.name || "";

  // 🕛 Start & end of selected date
  const dayStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [selectedDate]);

  const dayEnd = useMemo(() => {
    const d = new Date(selectedDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [selectedDate]);

  // 🧩 Filter data for the selected date & logged-in user
  const dayUserData = useMemo(() => {
    return hourlyData.filter((h) => {
      if (!h?.user?.user_name || !userName) return false;
      if (h.user.user_name !== userName) return false;
      if (!h.reportDate) return false;

      // Handle Mongo style { $date: "..." } and plain ISO/date
      const raw = h.reportDate.$date || h.reportDate;
      const reportDate = new Date(raw);

      return reportDate >= dayStart && reportDate <= dayEnd;
    });
  }, [hourlyData, userName, dayStart, dayEnd]);

  // 🧮 Calculate top 3 defects for that date
  const topDefects = useMemo(() => {
    const defectMap = {};
    let totalInspected = 0;

    dayUserData.forEach((entry) => {
      const inspectedQty = entry?.inspectedQty ?? 0;
      totalInspected += inspectedQty;

      (entry.selectedDefects || []).forEach((defect) => {
        if (!defect?.name) return;
        if (!defectMap[defect.name]) {
          defectMap[defect.name] = { quantity: 0 };
        }
        defectMap[defect.name].quantity += defect.quantity || 0;
      });
    });

    const defectArray = Object.entries(defectMap).map(
      ([name, { quantity }]) => ({
        name,
        quantity,
        // (defect qty / total inspected qty) × 100
        percentage:
          totalInspected > 0
            ? ((quantity / totalInspected) * 100).toFixed(2)
            : "0.00",
      })
    );

    // Sort by highest quantity → top 3
    return defectArray.sort((a, b) => b.quantity - a.quantity).slice(0, 3);
  }, [dayUserData]);

  // 📆 For header & "no data" text
  const selectedDateLabel = useMemo(
    () =>
      selectedDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    [selectedDate]
  );

  // 🔢 Format selectedDate for <input type="date" />
  const dateInputValue = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const d = String(selectedDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // 🚫 No defects found
  if (topDefects.length === 0) {
    return (
      <div className="mx-auto mt-3 w-full max-w-4xl">
        {/* Date picker row */}
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-sm font-semibold text-gray-700">
            Top Three Defects
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-600">Select date:</span>
            <input
              type="date"
              value={dateInputValue}
              onChange={(e) => {
                if (!e.target.value) return;
                const [year, month, day] = e.target.value.split("-");
                const next = new Date(
                  Number(year),
                  Number(month) - 1,
                  Number(day)
                );
                next.setHours(0, 0, 0, 0);
                setSelectedDate(next);
              }}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs"
            />
          </div>
        </div>

        <div className="mt-2 text-center text-sm text-gray-500">
          No defect data available for {selectedDateLabel}.
        </div>
      </div>
    );
  }

  // 🧱 UI
  return (
    <div className="mx-auto mt-3 w-full max-w-4xl">
      {/* Top row: title + date picker */}
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="rounded-t-md bg-red-700 px-4 py-1 text-center text-sm font-bold text-white flex-1">
          TOP THREE (3) DEFECTS - {selectedDateLabel}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-gray-600">Select date:</span>
          <input
            type="date"
            value={dateInputValue}
            onChange={(e) => {
              if (!e.target.value) return;
              const [year, month, day] = e.target.value.split("-");
              const next = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
              );
              next.setHours(0, 0, 0, 0);
              setSelectedDate(next);
            }}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
        </div>
      </div>

      {/* Table layout */}
      <div className="grid grid-cols-4 text-center text-xs font-semibold text-white">
        {/* Header row */}
        <div className="border border-white bg-red-600 py-2">RANK</div>
        <div className="border border-white bg-red-600 py-2">DEFECT NAME</div>
        <div className="border border-white bg-red-600 py-2">DEFECT QTY</div>
        <div className="border border-white bg-red-600 py-2">DEFECT %</div>

        {/* Data rows */}
        {topDefects.map((defect, index) => (
          <React.Fragment key={defect.name}>
            <div className="border border-white bg-red-500 py-2">
              #{index + 1}
            </div>
            <div className="border border-white bg-red-500 py-2">
              {defect.name}
            </div>
            <div className="border border-white bg-red-500 py-2">
              {defect.quantity}
            </div>
            <div className="border border-white bg-red-500 py-2">
              {defect.percentage}%
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
