"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function HourlyDashboardComponent({
  hourlyData,
  productionData,
  registerData,
  users,
}) {
  const { auth } = useAuth();
  const router = useRouter();

  // Show when props last changed (useful to see refresh working)
  const [lastUpdate, setLastUpdate] = useState(new Date());
  useEffect(() => {
    setLastUpdate(new Date());
  }, [hourlyData, productionData, registerData, users]);

  // 🔄 Auto-refresh server data every 5s (no fetch here)
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh(); // re-runs the Server Component page and passes new props
    }, 5000);
    return () => clearInterval(id);
  }, [router]);

  if (!auth) {
    return (
      <div className="text-center mt-6 text-red-600 font-medium">
        ⚠️ Please log in to view hourly inspection data.
      </div>
    );
  }

  // ✅ Check if a date is today
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  // ✅ Filter only today's data for this user (from props)
  const userHourlyData = useMemo(
    () =>
      (Array.isArray(hourlyData) ? hourlyData : []).filter(
        (h) => h?.user?.user_name === auth.user_name && isToday(h?.reportDate)
      ),
    [hourlyData, auth.user_name]
  );

  // ✅ Utility to create ordinal labels
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // ✅ Define 12 hourly slots
  const hours = useMemo(
    () => Array.from({ length: 12 }, (_, i) => `${getOrdinal(i + 1)} Hour`),
    []
  );

  // ✅ Find entry for specific hour
  const getHourlyByLabel = (label) =>
    userHourlyData.find((h) => h.hourLabel === label) || {};

  // ✅ Calculations
  const calculateDefectiveRate = (d) => {
    const { defectivePcs = 0, inspectedQty = 0 } = d || {};
    return inspectedQty ? ((defectivePcs / inspectedQty) * 100).toFixed(2) + "%" : "0%";
  };

  const calculateDHU = (d) => {
    const { totalDefects = 0, inspectedQty = 0 } = d || {};
    return inspectedQty ? ((totalDefects / inspectedQty) * 100).toFixed(2) + "%" : "0%";
  };

  // ✅ All unique defect names across hours
  const allDefects = useMemo(
    () =>
      Array.from(
        new Set(
          userHourlyData.flatMap((h) => (h.selectedDefects || []).map((d) => d.name))
        )
      ),
    [userHourlyData]
  );

  return (
    <div className="overflow-x-auto text-[10px] md:text-xs mt-4 text-gray-800">
      {/* tiny status line to confirm refreshes */}
      <div className="mb-2 text-[10px] text-gray-500">
        Last update: {lastUpdate.toLocaleTimeString()}
      </div>

      <table className="table-auto w-full min-w-[1200px] border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-100 text-gray-800">
            <th className="border border-gray-400 px-3 py-2 font-semibold text-left">
              Defect Name/Code
            </th>
            {hours.map((hr, i) => (
              <th
                key={i}
                className="border border-gray-400 px-3 py-2 font-semibold text-center"
              >
                {hr}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {allDefects.length > 0 ? (
            allDefects.map((defectName, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="border border-gray-400 px-3 py-1 bg-gray-50 font-medium">
                  {defectName}
                </td>
                {hours.map((hr, i) => {
                  const hourEntry = getHourlyByLabel(hr);
                  const defect =
                    hourEntry.selectedDefects?.find((d) => d.name === defectName);
                  return (
                    <td
                      key={i}
                      className="border border-gray-400 px-3 py-1 text-center"
                    >
                      {defect?.quantity ?? 0}
                    </td>
                  );
                })}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={hours.length + 1}
                className="text-center text-gray-500 py-4 border border-gray-400"
              >
                No defect data found for today.
              </td>
            </tr>
          )}

          {/* Total Defects */}
          <tr className="bg-gray-100 font-medium">
            <td className="border border-gray-400 px-3 py-1">Total Defects</td>
            {hours.map((hr, i) => (
              <td key={i} className="border border-gray-400 px-3 py-1 text-center">
                {getHourlyByLabel(hr)?.totalDefects ?? 0}
              </td>
            ))}
          </tr>

          {/* Inspected Quantity */}
          <tr className="bg-white font-medium">
            <td className="border border-gray-400 px-3 py-1">Inspected Quantity</td>
            {hours.map((hr, i) => (
              <td key={i} className="border border-gray-400 px-3 py-1 text-center">
                {getHourlyByLabel(hr)?.inspectedQty ?? 0}
              </td>
            ))}
          </tr>

          {/* Passed Quantity */}
          <tr className="bg-white font-medium">
            <td className="border border-gray-400 px-3 py-1">Passed Quantity</td>
            {hours.map((hr, i) => (
              <td key={i} className="border border-gray-400 px-3 py-1 text-center">
                {getHourlyByLabel(hr)?.passedQty ?? 0}
              </td>
            ))}
          </tr>

          {/* Receive After Repair */}
          <tr className="bg-white font-medium">
            <td className="border border-gray-400 px-3 py-1">Receive After Repair</td>
            {hours.map((hr, i) => (
              <td key={i} className="border border-gray-400 px-3 py-1 text-center">
                {getHourlyByLabel(hr)?.afterRepair ?? 0}
              </td>
            ))}
          </tr>

          {/* Defective Pieces */}
          <tr className="bg-white font-medium">
            <td className="border border-gray-400 px-3 py-1">Defective Pieces</td>
            {hours.map((hr, i) => (
              <td key={i} className="border border-gray-400 px-3 py-1 text-center">
                {getHourlyByLabel(hr)?.defectivePcs ?? 0}
              </td>
            ))}
          </tr>

          {/* Defective Rate */}
          <tr className="bg-red-600 text-white font-semibold">
            <td className="border border-gray-400 px-3 py-1 text-center">Defective Rate</td>
            {hours.map((hr, i) => (
              <td
                key={i}
                className="border border-gray-400 px-3 py-1 text-center font-bold"
              >
                {calculateDefectiveRate(getHourlyByLabel(hr))}
              </td>
            ))}
          </tr>

          {/* DHU% */}
          <tr className="bg-blue-600 text-white font-semibold">
            <td className="border border-gray-400 px-3 py-1 text-center">DHU%</td>
            {hours.map((hr, i) => (
              <td
                key={i}
                className="border border-gray-400 px-3 py-1 text-center font-bold"
              >
                {calculateDHU(getHourlyByLabel(hr))}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
