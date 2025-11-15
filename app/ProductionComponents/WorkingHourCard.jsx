"use client";

import { useMemo, useState } from "react";

// Small helper so you don't see NaN everywhere
function formatNumber(value, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(digits);
}

export default function WorkingHourCard({
  // You can change which hours are available
  hours = [1, 2, 3, 4, 5, 6, 7, 8],

  // 🔹 Base values (you can override these from parent later)
  presentManpower = 50,
  smv = 1.2,
  planEfficiency = 0.9,
  workingMinutesPerHour = 60,

  // 🔹 Optional callbacks
  onSave,
  onEdit,
  onDelete,
}) {
  const [selectedHour, setSelectedHour] = useState(hours[0] ?? 1);
  const [achievedInput, setAchievedInput] = useState("");

  // 🔹 All auto calculations live here
  const {
    numericAchieved,
    hourlyTarget,
    varianceQty,
    hourlyEfficiency,
    achieveEfficiency,
    total,
  } = useMemo(() => {
    const numericAchieved = Number(achievedInput) || 0;
    const workingHour = Number(selectedHour) || 0;

    // ⚙️ Replace these with your exact formulas if needed

    // Formula from your image:
    // Working Hour * Present Manpower / SMV * Plan Efficiency
    const hourlyTarget =
      workingHour * presentManpower * (planEfficiency / smv);

    // Hourly Target - Achieved
    const varianceQty = hourlyTarget - numericAchieved;

    // Hourly Output * SMV / Manpower * 60 * 100
    const hourlyEfficiency =
      presentManpower && workingMinutesPerHour
        ? (numericAchieved * smv * 100) /
          (presentManpower * workingMinutesPerHour)
        : 0;

    // Hourly Output * SMV / Manpower * 60 * Working Hour
    const achieveEfficiency =
      presentManpower && workingMinutesPerHour
        ? (numericAchieved * smv * workingHour) /
          (presentManpower * workingMinutesPerHour)
        : 0;

    // You can change this to whatever "Total" means for you
    const total = numericAchieved;

    return {
      numericAchieved,
      hourlyTarget,
      varianceQty,
      hourlyEfficiency,
      achieveEfficiency,
      total,
    };
  }, [
    achievedInput,
    selectedHour,
    presentManpower,
    smv,
    planEfficiency,
    workingMinutesPerHour,
  ]);

  const payload = {
    hour: Number(selectedHour),
    achieved: numericAchieved,
    hourlyTarget,
    varianceQty,
    hourlyEfficiency,
    achieveEfficiency,
    total,
  };

  const handleSave = () => {
    onSave?.(payload);
    console.log("Save:", payload);
  };

  const handleEdit = () => {
    onEdit?.(payload);
    console.log("Edit:", payload);
  };

  const handleDelete = () => {
    onDelete?.(payload);
    console.log("Delete:", payload);
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-xl border border-gray-300 bg-white shadow-sm p-4">
      {/* Header */}
      <div className="mb-3 border-b pb-2 text-center text-sm font-semibold tracking-wide uppercase">
        Working Hour
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-2 text-left">Hour</th>
              <th className="px-2 py-2 text-left">Hourly Target</th>
              <th className="px-2 py-2 text-left">Achieved Qty</th>
              <th className="px-2 py-2 text-left">Variance Qty</th>
              <th className="px-2 py-2 text-left">Hourly Efficiency %</th>
              <th className="px-2 py-2 text-left">Achieve Efficiency</th>
              <th className="px-2 py-2 text-left">Total</th>
            </tr>
          </thead>

          <tbody>
            <tr className="border-b">
              {/* Hour selector (manual) */}
              <td className="px-2 py-2 align-top">
                <select
                  className="w-full rounded border px-2 py-1 text-xs"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                >
                  {hours.map((h) => (
                    <option key={h} value={h}>
                      {h} hour{h > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-500">
                  Manual selection
                </p>
              </td>

              {/* Hourly Target (auto) */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(hourlyTarget)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Formula: Working Hour × Present Manpower ÷ SMV × Plan
                  Efficiency
                </p>
              </td>

              {/* Achieved input (manual) */}
              <td className="px-2 py-2 align-top">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded border px-2 py-1 text-xs"
                  value={achievedInput}
                  onChange={(e) => setAchievedInput(e.target.value)}
                  placeholder="Enter achieved"
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Manual input (Achieved)
                </p>
              </td>

              {/* Variance Qty (auto) */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(varianceQty)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Formula: Hourly Target − Achieved
                </p>
              </td>

              {/* Hourly Efficiency (auto) */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(hourlyEfficiency)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Formula: Hourly Output × SMV ÷ Manpower ÷ 60 × 100
                </p>
              </td>

              {/* Achieve Efficiency (auto) */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(achieveEfficiency)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Formula: Hourly Output × SMV ÷ Manpower ÷ 60 × Working Hour
                </p>
              </td>

              {/* Total (auto, you decide logic) */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(total)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Total(Total achive efficiency from 1st h to present h)/hour(in percentage)

                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center justify-end gap-2 text-xs">
        <button
          type="button"
          onClick={handleSave}
          className="rounded bg-gray-900 px-3 py-1 font-medium text-white hover:bg-gray-800"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleEdit}
          className="rounded border border-gray-400 px-3 py-1 font-medium text-gray-700 hover:bg-gray-100"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-red-400 px-3 py-1 font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
