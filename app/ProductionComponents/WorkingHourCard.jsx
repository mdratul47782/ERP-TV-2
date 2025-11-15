// app/ProductionComponents/WorkingHourCard.jsx
"use client";

import { useEffect, useState } from "react";
import { useProductionAuth } from "../hooks/useProductionAuth";

function formatNumber(value, digits = 2) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  return num.toFixed(digits);
}

export default function WorkingHourCard({ header }) {
  // Normalize header: allow array or single object
  const h = Array.isArray(header) ? header[0] : header || null;

  const { ProductionAuth, loading: productionLoading } = useProductionAuth();

  const [selectedHour, setSelectedHour] = useState(1);
  const [achievedInput, setAchievedInput] = useState("");
  const [hourlyRecords, setHourlyRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [latestDynamicFromServer, setLatestDynamicFromServer] =
    useState(null);

  useEffect(() => {
    console.log("WorkingHourCard header:", h);
  }, [h]);

  useEffect(() => {
    console.log("hello i am production auth", ProductionAuth);
  }, [ProductionAuth]);

  // 🔹 Guard: no header
  if (!h) {
    return (
      <div className="w-full max-w-6xl mx-auto rounded-xl border border-gray-300 bg-white shadow-sm p-4 text-xs">
        No production header found. Please save a header first.
      </div>
    );
  }

  const headerProdName = h.productionUser?.Production_user_name ?? "";
  const authProdName = ProductionAuth?.Production_user_name ?? "";

  const isMatched =
    headerProdName &&
    authProdName &&
    headerProdName.toLowerCase() === authProdName.toLowerCase();

  const totalWorkingHours = h.workingHour ?? 1;
  const manpowerPresent = h.manpowerPresent ?? 0;
  const smv = h.smv ?? 1;
  const planEfficiencyPercent = h.planEfficiency ?? 0;
  const planEffDecimal = planEfficiencyPercent / 100;
  const todayTarget = h.todayTarget ?? 0;

  const hours = Array.from(
    { length: Math.max(1, totalWorkingHours) },
    (_, i) => i + 1
  );

  // 🔹 Base hourly target (same logic as API)
  const targetFromTodayTarget =
    totalWorkingHours > 0 ? todayTarget / totalWorkingHours : 0;
  const targetFromCapacity =
    manpowerPresent > 0 && smv > 0
      ? (manpowerPresent * 60 * planEffDecimal) / smv
      : 0;
  const baseTargetPerHour = targetFromTodayTarget || targetFromCapacity || 0;

  const achievedThisHour = Number(achievedInput) || 0;

  // 🔹 Load existing hourly records for this header + production user
  useEffect(() => {
    const fetchRecords = async () => {
      if (!h?._id || !ProductionAuth?.id) return;
      try {
        setLoadingRecords(true);
        setError("");
        setMessage("");

        const params = new URLSearchParams({
          headerId: h._id,
          productionUserId: ProductionAuth.id,
        });

        const res = await fetch(`/api/hourly-productions?${params.toString()}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          throw new Error(json.message || "Failed to load hourly records");
        }

        const records = json.data || [];
        setHourlyRecords(records);

        if (records.length > 0) {
          const last = records[records.length - 1];
          setLatestDynamicFromServer(last.dynamicTarget ?? null);
        } else {
          setLatestDynamicFromServer(null);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load hourly records");
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [h?._id, ProductionAuth?.id]);

  // 🔹 Hourly efficiency (this hour only)
  //   Hourly Eff % = Hourly Output * SMV / (Manpower * 60) * 100
  const hourlyEfficiency =
    manpowerPresent > 0 && smv > 0
      ? (achievedThisHour * smv * 100) / (manpowerPresent * 60)
      : 0;

  // 🔹 Achieve Efficiency (for this line up to this working hour)
  //   Formula you gave:
  //   Hourly Output * SMV / Manpower * 60 * Working Hour
  //   Interpreted as:
  //   (Hourly Output * SMV) / (Manpower * 60) * Working Hour
  const achieveEfficiency =
    manpowerPresent > 0 && smv > 0
      ? (achievedThisHour * smv * selectedHour) /
        (manpowerPresent * 60)
      : 0;

  // 🔹 Carry-over logic (shortfall / surplus) to show dynamic target

  // Shortfall till previous hours for the currently selected hour
  const shortfallUntilPrev = hourlyRecords.reduce((sum, rec) => {
    if (typeof rec.hour !== "number" || rec.hour >= selectedHour) {
      return sum;
    }
    const dyn = Number(rec.dynamicTarget);
    const ach = Number(rec.achievedQty);
    const dynSafe = Number.isFinite(dyn) ? dyn : baseTargetPerHour;
    const achSafe = Number.isFinite(ach) ? ach : 0;
    return sum + (dynSafe - achSafe);
  }, 0);

  // Dynamic target for THIS hour
  const dynamicTargetThisHour = baseTargetPerHour + shortfallUntilPrev;

  if (productionLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto rounded-xl border border-gray-300 bg-white shadow-sm p-4 text-xs">
        Loading production user...
      </div>
    );
  }

  if (!ProductionAuth) {
    return (
      <div className="w-full max-w-6xl mx-auto rounded-xl border border-yellow-300 bg-yellow-50 shadow-sm p-4 text-xs">
        No production user logged in. Please sign in to see working hour
        details.
      </div>
    );
  }

  if (!isMatched) {
    return (
      <div className="w-full max-w-6xl mx-auto rounded-xl border border-rose-300 bg-rose-50 shadow-sm p-4 text-xs space-y-1.5">
        <div className="font-semibold text-rose-700">
          Header does not belong to the logged-in production user.
        </div>
        <div className="text-slate-700">
          <span className="font-medium">Header production user:</span>{" "}
          {headerProdName || "N/A"}
        </div>
        <div className="text-slate-700">
          <span className="font-medium">Logged-in production user:</span>{" "}
          {authProdName || "N/A"}
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      if (!h._id) {
        throw new Error("Missing headerId");
      }

      if (!achievedThisHour || achievedThisHour < 0) {
        throw new Error("Please enter a valid achieved qty for this hour");
      }

      const payload = {
        headerId: h._id,
        hour: selectedHour,
        achievedQty: achievedThisHour,
        productionUser: {
          id: ProductionAuth.id,
          Production_user_name: ProductionAuth.Production_user_name,
          phone: ProductionAuth.phone,
          bio: ProductionAuth.bio,
        },
      };

      const res = await fetch("/api/hourly-productions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(
          json?.errors?.join(", ") ||
            json?.message ||
            "Failed to save hourly production record"
        );
      }

      // Refresh list
      const params = new URLSearchParams({
        headerId: h._id,
        productionUserId: ProductionAuth.id,
      });
      const resList = await fetch(
        `/api/hourly-productions?${params.toString()}`
      );
      const jsonList = await resList.json();
      if (resList.ok && jsonList.success) {
        const records = jsonList.data || [];
        setHourlyRecords(records);
        if (records.length > 0) {
          const last = records[records.length - 1];
          setLatestDynamicFromServer(last.dynamicTarget ?? null);
        } else {
          setLatestDynamicFromServer(null);
        }
      }

      setAchievedInput("");
      setMessage("Hourly record saved successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save hourly record");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    console.log("Edit clicked – wire this to PATCH /api/hourly-productions/:id");
  };

  const handleDelete = () => {
    console.log(
      "Delete clicked – you can call DELETE /api/hourly-productions/:id from a specific row"
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto rounded-xl border border-gray-300 bg-white shadow-sm p-4">
      {/* Header */}
      <div className="mb-3 border-b pb-2 flex items-center justify-between text-xs">
        <div className="font-semibold tracking-wide uppercase">
          Working Hour
        </div>
        <div className="text-[11px] text-slate-600 space-y-0.5 text-right">
          <div>
            <span className="font-medium">Production User:</span>{" "}
            {headerProdName}
          </div>
          <div>
            <span className="font-medium">Planned Working Hours:</span>{" "}
            {totalWorkingHours}
          </div>
        </div>
      </div>

      {/* Messages */}
      {(error || message) && (
        <div className="mb-3 text-[11px]">
          {error && (
            <div className="mb-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-red-700">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-emerald-700">
              {message}
            </div>
          )}
        </div>
      )}

      {/* Summary values */}
      <div className="mb-3 text-[11px] text-slate-600 flex flex-wrap gap-4">
        <div>Present Manpower: {manpowerPresent}</div>
        <div>SMV (min/pc): {smv}</div>
        <div>Plan Efficiency: {planEfficiencyPercent}%</div>
        <div>Day Target: {todayTarget}</div>
        <div>Base Target / Hour: {formatNumber(baseTargetPerHour)}</div>
        {latestDynamicFromServer !== null && (
          <div>
            Last Saved Dynamic Target: {formatNumber(latestDynamicFromServer)}
          </div>
        )}
        <div>
          Shortfall till prev hour: {formatNumber(shortfallUntilPrev)}
        </div>
        <div>
          Dynamic target this hour: {formatNumber(dynamicTargetThisHour)}
        </div>
      </div>

      {/* Main input row */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-2 text-left">Hour</th>
              <th className="px-2 py-2 text-left">Base Target / hr</th>
              <th className="px-2 py-2 text-left">
                Dynamic Target (this hour)
              </th>
              <th className="px-2 py-2 text-left">
                Achieved Qty (this hour)
              </th>
              <th className="px-2 py-2 text-left">Hourly Efficiency %</th>
              <th className="px-2 py-2 text-left">Achieve Efficiency</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              {/* Hour selector */}
              <td className="px-2 py-2 align-top">
                <select
                  className="w-full rounded border px-2 py-1 text-xs"
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(Number(e.target.value))}
                >
                  {hours.map((hVal) => (
                    <option key={hVal} value={hVal}>
                      {hVal} hour{hVal > 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-gray-500">
                  Current hour (1 ~ {totalWorkingHours})
                </p>
              </td>

              {/* Base hourly target */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(baseTargetPerHour)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  (Day target ÷ hours) or (Manpower × 60 ÷ SMV × Plan %)
                </p>
              </td>

              {/* Dynamic target this hour */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-amber-50 px-2 py-1">
                  {formatNumber(dynamicTargetThisHour)}
                </div>
                <p className="mt-1 text-[10px] text-amber-700 leading-tight">
                  Base + shortfall from previous hours
                </p>
              </td>

              {/* Achieved Qty (this hour) */}
              <td className="px-2 py-2 align-top">
                <input
                  type="number"
                  min="0"
                  className="w-full rounded border px-2 py-1 text-xs"
                  value={achievedInput}
                  onChange={(e) => setAchievedInput(e.target.value)}
                  placeholder="Output this hour"
                />
                <p className="mt-1 text-[10px] text-gray-500">
                  Actual pieces this hour
                </p>
              </td>

              {/* Hourly efficiency (this hour) */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(hourlyEfficiency)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Output × SMV ÷ (Manpower × 60) × 100
                </p>
              </td>

              {/* Achieve Efficiency */}
              <td className="px-2 py-2 align-top">
                <div className="rounded border bg-gray-50 px-2 py-1">
                  {formatNumber(achieveEfficiency)}
                </div>
                <p className="mt-1 text-[10px] text-gray-500 leading-tight">
                  Hourly Output × SMV ÷ (Manpower × 60) × Working Hour
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
          className="rounded bg-gray-900 px-3 py-1 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Hour"}
        </button>
        <button
          type="button"
          onClick={handleEdit}
          className="rounded border border-gray-400 px-3 py-1 font-medium text-gray-700 hover:bg-gray-100"
        >
          Edit (wire later)
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded border border-red-400 px-3 py-1 font-medium text-red-600 hover:bg-red-50"
        >
          Delete (wire later)
        </button>
      </div>

     {/* Posted hourly data */}
<div className="mt-4">
  <div className="flex items-center justify-between text-xs mb-2">
    <h3 className="font-semibold">Posted hourly records</h3>
    {loadingRecords && (
      <span className="text-[10px] text-slate-500">
        Loading hourly records...
      </span>
    )}
  </div>

  {hourlyRecords.length === 0 ? (
    <p className="text-[11px] text-slate-500">
      No hourly records saved yet for this header.
    </p>
  ) : (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px] border-t">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-2 py-1 text-left">Hour</th>
            <th className="px-2 py-1 text-left">Dynamic Target</th>
            <th className="px-2 py-1 text-left">Achieved</th>
            <th className="px-2 py-1 text-left">Variance</th>
            <th className="px-2 py-1 text-left">Hourly Eff %</th>
            <th className="px-2 py-1 text-left">Achieve Eff</th>
            <th className="px-2 py-1 text-left">Total Eff %</th>
            <th className="px-2 py-1 text-left">Updated At</th>
          </tr>
        </thead>
        <tbody>
          {hourlyRecords.map((rec) => (
            <tr key={rec._id} className="border-b">
              <td className="px-2 py-1">{rec.hour}</td>
              <td className="px-2 py-1">
                {formatNumber(rec.dynamicTarget)}
              </td>
              <td className="px-2 py-1">{rec.achievedQty}</td>
              <td className="px-2 py-1">
                {formatNumber(rec.varianceQty)}
              </td>
              <td className="px-2 py-1">
                {formatNumber(rec.hourlyEfficiency)}
              </td>
              {/* 🔹 stored Achieve Efficiency from API */}
              <td className="px-2 py-1">
                {formatNumber(rec.achieveEfficiency)}
              </td>
              {/* 🔹 totalEfficiency (currently same as achieveEfficiency) */}
              <td className="px-2 py-1">
                {formatNumber(rec.totalEfficiency)}
              </td>
              <td className="px-2 py-1">
                {rec.updatedAt
                  ? new Date(rec.updatedAt).toLocaleTimeString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</div>

    </div>
  );
}
