"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function HourlyDashboardComponent({
  hourlyData,
  productionData,
  registerData,
  users,
}) {
  const { auth } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Helpers
  const toLocalYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const formatPct = (n) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0.00%";
    return `${Math.max(0, Math.min(100, x)).toFixed(2)}%`;
  };

  // Selected date (defaults to today or ?date= from URL if present)
  const initialDate = searchParams?.get("date") || toLocalYMD(new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate);

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

  // ✅ Compare reportDate to selected yyyy-mm-dd (LOCAL time)
  const isSameDay = (dateStr, ymd) => {
    if (!dateStr || !ymd) return false;
    const d = new Date(dateStr);
    return toLocalYMD(d) === ymd;
  };

  // ✅ Filter only selected date's data for this user (from props)
  const userHourlyData = useMemo(
    () =>
      (Array.isArray(hourlyData) ? hourlyData : []).filter(
        (h) =>
          h?.user?.user_name === auth.user_name &&
          isSameDay(h?.reportDate, selectedDate)
      ),
    [hourlyData, auth.user_name, selectedDate]
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

  // ✅ Calculations (per hour)
  const calculateDefectiveRate = (d) => {
    const { defectivePcs = 0, inspectedQty = 0 } = d || {};
    return inspectedQty
      ? ((defectivePcs / inspectedQty) * 100).toFixed(2) + "%"
      : "0%";
  };

  const calculateDHU = (d) => {
    const { totalDefects = 0, inspectedQty = 0 } = d || {};
    return inspectedQty
      ? ((totalDefects / inspectedQty) * 100).toFixed(2) + "%"
      : "0%";
  };

  const calculateRFT = (d) => {
    const { passedQty = 0, inspectedQty = 0 } = d || {};
    return inspectedQty
      ? ((passedQty / inspectedQty) * 100).toFixed(2) + "%"
      : "0%";
  };

  // ✅ Numeric rates for styling only
  const getRateNumbers = (d) => {
    const inspected = d?.inspectedQty ?? 0;
    const defective = d?.defectivePcs ?? 0;
    const total = d?.totalDefects ?? 0;
    const passed = d?.passedQty ?? 0;
    return {
      defectiveRate: inspected ? (defective / inspected) * 100 : 0,
      dhu: inspected ? (total / inspected) * 100 : 0,
      rft: inspected ? (passed / inspected) * 100 : 0,
    };
  };

  // For "bad" metrics: high = red
  const rateBadgeClass = (pct) => {
    if (pct <= 1) return "bg-green-50 text-green-700 ring-1 ring-green-200";
    if (pct <= 3) return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
  };

  // For RFT (good metric): high = green
  const rftBadgeClass = (pct) => {
    if (pct >= 98) return "bg-green-50 text-green-700 ring-1 ring-green-200";
    if (pct >= 95) return "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200";
    return "bg-red-50 text-red-700 ring-1 ring-red-200";
  };

  // ✅ All unique defect names across hours (for selected date)
  const allDefects = useMemo(
    () =>
      Array.from(
        new Set(
          userHourlyData.flatMap((h) =>
            (h.selectedDefects || []).map((d) => d.name)
          )
        )
      ),
    [userHourlyData]
  );

  // ✅ Daily totals across all hours for the selected date
  const dailyTotals = useMemo(() => {
    return userHourlyData.reduce(
      (acc, h) => {
        acc.inspectedQty += Number(h?.inspectedQty || 0);
        acc.defectivePcs += Number(h?.defectivePcs || 0);
        acc.totalDefects += Number(h?.totalDefects || 0);
        acc.passedQty += Number(h?.passedQty || 0);
        return acc;
      },
      { inspectedQty: 0, defectivePcs: 0, totalDefects: 0, passedQty: 0 }
    );
  }, [userHourlyData]);

  const overallDefectRate = useMemo(() => {
    return dailyTotals.inspectedQty > 0
      ? (dailyTotals.defectivePcs / dailyTotals.inspectedQty) * 100
      : 0;
  }, [dailyTotals]);

  const overallDHU = useMemo(() => {
    return dailyTotals.inspectedQty > 0
      ? (dailyTotals.totalDefects / dailyTotals.inspectedQty) * 100
      : 0;
  }, [dailyTotals]);

  const overallRFT = useMemo(() => {
    return dailyTotals.inspectedQty > 0
      ? (dailyTotals.passedQty / dailyTotals.inspectedQty) * 100
      : 0;
  }, [dailyTotals]);

  const handlePrint = () => {
    setTimeout(() => window.print(), 50);
  };

  const handleDateChange = (e) => {
    const ymd = e.target.value;
    setSelectedDate(ymd);
    // Keep URL in sync so the server can fetch by date
    const sp = new URLSearchParams(searchParams?.toString());
    sp.set("date", ymd);
    router.replace(`?${sp.toString()}`);
    router.refresh();
  };

  const jumpToToday = () => {
    const today = toLocalYMD(new Date());
    setSelectedDate(today);
    const sp = new URLSearchParams(searchParams?.toString());
    sp.set("date", today);
    router.replace(`?${sp.toString()}`);
    router.refresh();
  };

  return (
    <div className="mt-4 text-gray-800">
      {/* Top bar: status + date picker + Print */}
      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between no-print">
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-gray-500">
            Last update:{" "}
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
              {lastUpdate.toLocaleTimeString()}
            </span>
          </div>
          <div className="text-[10px] text-gray-500">
            Viewing date:{" "}
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5">
              {selectedDate}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs md:text-sm text-gray-700" htmlFor="date">
            Pick date:
          </label>
          <input
            id="date"
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="rounded-md border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="button"
            onClick={jumpToToday}
            className="rounded-md bg-white px-3 py-1.5 text-xs md:text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
            title="Jump to today"
          >
            Today
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            title="Print (Excel-style)"
          >
            Print
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        <table
          className="excel-table tabular-nums w-full min-w-[1200px] border-collapse text-[11px] md:text-sm"
          aria-label="Hourly Defect Summary"
        >
          <thead className="sticky top-0 z-20 excel-header">
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
                    const defect = hourEntry.selectedDefects?.find(
                      (d) => d.name === defectName
                    );
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
                  No defect data found for the selected date.
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
                <td
                  key={i}
                  className="border border-gray-200 px-3 py-2 text-center"
                >
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
                <td
                  key={i}
                  className="border border-gray-200 px-3 py-2 text-center"
                >
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
                <td
                  key={i}
                  className="border border-gray-200 px-3 py-2 text-center"
                >
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
                <td
                  key={i}
                  className="border border-gray-200 px-3 py-2 text-center"
                >
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
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs md:text-sm ${rateBadgeClass(
                        info.defectiveRate
                      )}`}
                    >
                      {calculateDefectiveRate(getHourlyByLabel(hr))}
                    </span>
                  </td>
                );
              })}
            </tr>

            {/* RFT% */}
            <tr className="bg-green-50/80">
              <td className="sticky left-0 z-10 border border-gray-200 px-3 py-2 bg-green-500 font-semibold text-center shadow-[4px_0_0_0_rgba(0,0,0,0.03)]">
                RFT%
              </td>
              {hours.map((hr, i) => {
                const info = getRateNumbers(getHourlyByLabel(hr));
                return (
                  <td
                    key={i}
                    className="border border-gray-200 px-3 py-2 text-center font-bold"
                  >
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs md:text-sm ${rftBadgeClass(
                        info.rft
                      )}`}
                    >
                      {calculateRFT(getHourlyByLabel(hr))}
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
                    <span
                      className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs md:text-sm ${rateBadgeClass(
                        info.dhu
                      )}`}
                    >
                      {calculateDHU(getHourlyByLabel(hr))}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>

          {/* 🔢 Overall summary for the selected day */}
          <tfoot>
            <tr>
              <td
                colSpan={hours.length + 1}
                className="bg-slate-100/80 px-3 py-3 text-right"
              >
                <div className="flex flex-col items-end gap-2 md:flex-row md:justify-end md:items-center md:gap-6">
                  <span className="text-sm text-slate-700">
                    Total Inspected:{" "}
                    <strong>{dailyTotals.inspectedQty}</strong>
                  </span>
                  <span className="text-sm text-slate-700">
                    Total Passed:{" "}
                    <strong>{dailyTotals.passedQty}</strong>
                  </span>
                  <span className="text-sm text-slate-700">
                    Total Defective Pcs:{" "}
                    <strong>{dailyTotals.defectivePcs}</strong>
                  </span>
                  <span className="text-sm text-slate-700">
                    Total Defects:{" "}
                    <strong>{dailyTotals.totalDefects}</strong>
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs md:text-sm ${rateBadgeClass(
                      overallDefectRate
                    )}`}
                  >
                    Total Defect Rate:{" "}
                    <strong className="ml-1">
                      {formatPct(overallDefectRate)}
                    </strong>
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs md:text-sm ${rateBadgeClass(
                      overallDHU
                    )}`}
                  >
                    Total DHU%:{" "}
                    <strong className="ml-1">
                      {formatPct(overallDHU)}
                    </strong>
                  </span>
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-xs md:text-sm ${rftBadgeClass(
                      overallRFT
                    )}`}
                  >
                    Total RFT%:{" "}
                    <strong className="ml-1">
                      {formatPct(overallRFT)}
                    </strong>
                  </span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        /* Page setup */
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }

        /* Hide UI chrome in print */
        @media print {
          .no-print {
            display: none !important;
          }
        }

        /* Excel-like table look for print */
        @media print {
          /* Remove sticky/gradients/shadows for clean pagination */
          .excel-table thead,
          .excel-table thead tr,
          .excel-table th.sticky,
          .excel-table td.sticky,
          .excel-table .sticky {
            position: static !important;
            inset: auto !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }

          /* Repeat header each printed page */
          .excel-table thead {
            display: table-header-group !important;
          }

          /* Gridlines and compact spacing */
          .excel-table {
            border-collapse: collapse !important;
            width: 100% !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
            background: #ffffff !important;
          }
          .excel-table th,
          .excel-table td {
            border: 1px solid #9ca3af !important; /* slate-400 */
            padding: 6px 8px !important;
            color: #111827 !important; /* gray-900 */
          }

          /* Header style (Excel-ish light gray fill) */
          .excel-header tr th {
            background: #e5e7eb !important; /* gray-200 */
            color: #111827 !important;
            font-weight: 700 !important;
          }

          /* Avoid breaking a row across pages */
          .excel-table tr {
            break-inside: avoid !important;
          }

          /* Remove zebra/hover tint which may not print reliably */
          .excel-table tr,
          .excel-table td,
          .excel-table th {
            background-image: none !important;
          }
        }

        /* Align numbers in columns */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
