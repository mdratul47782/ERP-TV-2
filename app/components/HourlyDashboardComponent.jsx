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

  // ✅ Calculations (kept intact for text shown)
  const calculateDefectiveRate = (d) => {
    const { defectivePcs = 0, inspectedQty = 0 } = d || {};
    return inspectedQty ? ((defectivePcs / inspectedQty) * 100).toFixed(2) + "%" : "0%";
  };

  const calculateDHU = (d) => {
    const { totalDefects = 0, inspectedQty = 0 } = d || {};
    return inspectedQty ? ((totalDefects / inspectedQty) * 100).toFixed(2) + "%" : "0%";
  };

  // ✅ Numeric rates for styling only (no functional change)
  const getRateNumbers = (d) => {
    const inspected = d?.inspectedQty ?? 0;
    const defective = d?.defectivePcs ?? 0;
    const total = d?.totalDefects ?? 0;
    return {
      defectiveRate: inspected ? (defective / inspected) * 100 : 0,
      dhu: inspected ? (total / inspected) * 100 : 0,
    };
  };

  const rateBadgeClass = (pct) => {
    if (pct <= 1) return "bg-green-50 text-green-700 ring-1 ring-green-200";
    if (pct <= 3) return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
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
    <div className="mt-4 text-gray-800">
      {/* tiny status line to confirm refreshes */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[10px] text-gray-500">
          Last update:{" "}
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
            {lastUpdate.toLocaleTimeString()}
          </span>
        </div>

        {/* Legend for rate colors */}
        {/* <div className="hidden md:flex items-center gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 ring-1 ring-green-200">
            ≤ 1% Good
          </span>
          <span className="px-2 py-0.5 rounded-md bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200">
            1–3% Watch
          </span>
          <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 ring-1 ring-red-200">
            &gt; 3% Action
          </span>
        </div> */}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table
          className="w-full min-w-[1200px] border-collapse text-[11px] md:text-sm"
          aria-label="Hourly Defect Summary"
        >
          <thead className="sticky top-0 z-20">
            <tr className="bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800">
              <th
                className="sticky left-0 z-30 border border-gray-200 px-3 py-2 text-left font-semibold shadow-[4px_0_0_0_rgba(0,0,0,0.04)] bg-gradient-to-r from-slate-100 to-slate-200"
                scope="col"
              >
                Defect Name/Code
              </th>
              {hours.map((hr, i) => (
                <th
                  key={i}
                  className="border border-gray-200 px-3 py-2 text-center font-semibold"
                  scope="col"
                >
                  {hr}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {allDefects.length > 0 ? (
              allDefects.map((defectName, idx) => (
                <tr
                  key={idx}
                  className="odd:bg-white even:bg-gray-50 hover:bg-slate-50 transition-colors"
                >
                  <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-white font-medium text-slate-700 shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                    {defectName}
                  </td>
                  {hours.map((hr, i) => {
                    const hourEntry = getHourlyByLabel(hr);
                    const defect =
                      hourEntry.selectedDefects?.find((d) => d.name === defectName);
                    return (
                      <td
                        key={i}
                        className="border border-gray-200 px-3 py-2 text-center text-slate-700"
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
                  className="text-center text-gray-500 py-6 border border-gray-200 bg-white"
                >
                  No defect data found for today.
                </td>
              </tr>
            )}

            {/* Total Defects */}
            <tr className="bg-slate-100/80 font-medium">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-slate-100/80 shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                Total Defects
              </td>
              {hours.map((hr, i) => (
                <td
                  key={i}
                  className="border border-gray-200 px-3 py-2 text-center text-slate-700"
                >
                  {getHourlyByLabel(hr)?.totalDefects ?? 0}
                </td>
              ))}
            </tr>

            {/* Inspected Quantity */}
            <tr className="bg-white font-medium">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-white shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                Inspected Quantity
              </td>
              {hours.map((hr, i) => (
                <td key={i} className="border border-gray-200 px-3 py-2 text-center">
                  {getHourlyByLabel(hr)?.inspectedQty ?? 0}
                </td>
              ))}
            </tr>

            {/* Passed Quantity */}
            <tr className="bg-white font-medium">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-white shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                Passed Quantity
              </td>
              {hours.map((hr, i) => (
                <td key={i} className="border border-gray-200 px-3 py-2 text-center">
                  {getHourlyByLabel(hr)?.passedQty ?? 0}
                </td>
              ))}
            </tr>

            {/* Receive After Repair */}
            <tr className="bg-white font-medium">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-white shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                Receive After Repair
              </td>
              {hours.map((hr, i) => (
                <td key={i} className="border border-gray-200 px-3 py-2 text-center">
                  {getHourlyByLabel(hr)?.afterRepair ?? 0}
                </td>
              ))}
            </tr>

            {/* Defective Pieces */}
            <tr className="bg-white font-medium">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-white shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                Defective Pieces
              </td>
              {hours.map((hr, i) => (
                <td key={i} className="border border-gray-200 px-3 py-2 text-center">
                  {getHourlyByLabel(hr)?.defectivePcs ?? 0}
                </td>
              ))}
            </tr>

            {/* Defective Rate */}
            <tr className="bg-red-50/80">
              <td className="sticky left-0 z-10 border bg-red-500 border-gray-200 px-3 py-2 font-semibold text-center shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                Defective Rate
              </td>
              {hours.map((hr, i) => {
                const info = getRateNumbers(getHourlyByLabel(hr));
                return (
                  <td
                    key={i}
                    className="border border-gray-200 px-3 py-2 text-center font-bold"
                  >
                    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs md:text-sm ${rateBadgeClass(info.defectiveRate)}`}>
                      {calculateDefectiveRate(getHourlyByLabel(hr))}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* DHU% */}
            <tr className="bg-red-50/80">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-red-500 font-semibold text-center shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                DHU%
              </td>
              {hours.map((hr, i) => {
                const info = getRateNumbers(getHourlyByLabel(hr));
                return (
                  <td
                    key={i}
                    className="border border-gray-200 px-3 py-2 text-center font-bold"
                  >
                    <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs md:text-sm ${rateBadgeClass(info.dhu)}`}>
                      {calculateDHU(getHourlyByLabel(hr))}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
