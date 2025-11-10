"use client";

import { useAuth } from "../hooks/useAuth";

export default function HourlyDashboardComponent({
  hourlyData,
  productionData,
  registerData,
  users,
}) {
  const { auth } = useAuth();

  if (!auth) {
    return (
      <div className="text-center mt-6 text-red-600 font-medium">
        ⚠️ Please log in to view hourly inspection data.
      </div>
    );
  }

  // ✅ Filter only this user’s hourly data
  const userHourlyData = hourlyData.filter(
    (h) => h?.user?.user_name === auth.user_name
  );

  // ✅ Utility to create correct ordinal labels (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"],
      v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  // ✅ 12-hour columns
  const hours = Array.from({ length: 12 }, (_, i) => `${getOrdinal(i + 1)} Hour`);

  // ✅ Helper: find a specific hour’s record
  const getHourlyByLabel = (label) =>
    userHourlyData.find((h) => h.hourLabel === label) || {};

  // ✅ Calculate defect rate & DHU
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

  // ✅ Collect all unique defect names across all hours
  const allDefects = Array.from(
    new Set(
      userHourlyData.flatMap((h) =>
        (h.selectedDefects || []).map((d) => d.name)
      )
    )
  );

  return (
    <div className="overflow-x-auto text-[10px] md:text-xs mt-4">
      {/* Table Header */}
      <table className="table-auto border-collapse border border-gray-400 w-full min-w-[1200px]">
        <thead>
          <tr>
            <th className="border px-2 py-1 bg-gray-100 font-semibold text-gray-700">
              Defect Name/Code
            </th>
            {hours.map((hr, i) => (
              <th key={i} className="border px-2 py-1 bg-gray-100 font-semibold text-gray-700">
                {hr}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {/* 🧩 Dynamic defect rows */}
          {allDefects.length > 0 ? (
            allDefects.map((defectName, idx) => (
              <tr key={idx}>
                <td className="border px-2 py-1 font-medium text-gray-700 bg-gray-50">
                  {defectName}
                </td>
                {hours.map((hr, i) => {
                  const hourEntry = getHourlyByLabel(hr);
                  const defect =
                    hourEntry.selectedDefects?.find((d) => d.name === defectName);
                  return (
                    <td
                      key={i}
                      className="border px-2 py-1 text-center text-gray-800"
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
                className="text-center text-gray-500 py-4"
              >
                No defect data found for this user.
              </td>
            </tr>
          )}

          {/* 🔹 Total Defects */}
          <tr>
            <td className="border px-2 py-1 font-semibold text-gray-700 bg-gray-50">
              Total Defects
            </td>
            {hours.map((hr, i) => (
              <td key={i} className="border px-2 py-1 text-center">
                {getHourlyByLabel(hr)?.totalDefects ?? 0}
              </td>
            ))}
          </tr>

          {/* 🔹 Inspected Quantity */}
          <tr>
            <td className="border px-2 py-1 font-medium text-gray-700 bg-gray-50">
              Inspected Quantity
            </td>
            {hours.map((hr, i) => (
              <td key={i} className="border px-2 py-1 text-center">
                {getHourlyByLabel(hr)?.inspectedQty ?? 0}
              </td>
            ))}
          </tr>

          {/* 🔹 Passed Quantity */}
          <tr>
            <td className="border px-2 py-1 font-medium text-gray-700 bg-gray-50">
              Passed Quantity
            </td>
            {hours.map((hr, i) => (
              <td key={i} className="border px-2 py-1 text-center">
                {getHourlyByLabel(hr)?.passedQty ?? 0}
              </td>
            ))}
          </tr>

          {/* 🔹 Receive After Repair */}
          <tr>
            <td className="border px-2 py-1 font-medium text-gray-700 bg-gray-50">
              Receive After Repair
            </td>
            {hours.map((hr, i) => (
              <td key={i} className="border px-2 py-1 text-center">
                {getHourlyByLabel(hr)?.afterRepair ?? 0}
              </td>
            ))}
          </tr>

          {/* 🔹 Defective Pieces */}
          <tr>
            <td className="border px-2 py-1 font-medium text-gray-700 bg-gray-50">
              Defective Pieces
            </td>
            {hours.map((hr, i) => (
              <td key={i} className="border px-2 py-1 text-center">
                {getHourlyByLabel(hr)?.defectivePcs ?? 0}
              </td>
            ))}
          </tr>

          {/* 🔴 Defective Rate */}
          <tr>
            <td className="bg-red-600 text-white px-2 py-1 text-center font-semibold">
              Defective Rate
            </td>
            {hours.map((hr, i) => (
              <td
                key={i}
                className="bg-red-500 text-white text-center px-2 py-1 font-bold"
              >
                {calculateDefectiveRate(getHourlyByLabel(hr))}
              </td>
            ))}
          </tr>

          {/* 🔵 DHU% */}
          <tr>
            <td className="bg-blue-600 text-white px-2 py-1 text-center font-semibold">
              DHU%
            </td>
            {hours.map((hr, i) => (
              <td
                key={i}
                className="bg-blue-500 text-white text-center px-2 py-1 font-bold"
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
