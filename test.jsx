"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";

// -------- helpers --------
const hourOptions = [
  "1st Hour","2nd Hour","3rd Hour","4th Hour","5th Hour","6th Hour",
  "7th Hour","8th Hour","9th Hour","10th Hour","11th Hour","12th Hour",
];

const defectOptions = [
  "Stitch Skip",
  "Broken Stitch",
  "Oil Stain",
  "Open Seam",
  "Measurement Issue",
];

function toLocalDateLabel(d = new Date()) {
  // Human-friendly title: e.g., "Mon, Nov 10, 2025"
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// We pass a full ISO timestamp to the API (safer with your startOfDay handler)
function todayIsoForApi() {
  return new Date().toISOString();
}

function getUserIdFromAuth(auth) {
  // Be flexible with shapes:
  return (
    auth?.user?.id ||
    auth?.user?._id ||
    auth?.id ||
    auth?._id ||
    null
  );
}

export default function EndlineDashboard() {
  const { auth } = useAuth();

  // ---- single form state (no “add another hour”) ----
  const [form, setForm] = useState({
    hour: "",
    selectedDefects: [],
    inspectedQty: "",
    passedQty: "",
    defectivePcs: "",
    afterRepair: "",
  });

  // ---- right panel (today’s rows for current user) ----
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const todayLabel = useMemo(() => toLocalDateLabel(), []);
  const userId = useMemo(() => getUserIdFromAuth(auth), [auth]);
  const userName = auth?.user_name || auth?.user?.user_name || "User";

  // ---- fetch today's entries ----
  const fetchToday = async () => {
    try {
      setLoading(true);
      setError("");
      const dateParam = todayIsoForApi();

      let url = `/api/hourly-inspections?date=${encodeURIComponent(
        dateParam
      )}&limit=500`;
      if (userId) url += `&userId=${userId}`;

      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to load data");

      let data = json?.data || [];
      // Fallback: if userId not available, filter by user_name
      if (!userId && userName) {
        data = data.filter((r) => r?.user?.user_name === userName);
      }

      // sort by hourIndex asc
      data.sort((a, b) => (a.hourIndex || 0) - (b.hourIndex || 0));
      setRows(data);
    } catch (e) {
      setError(e.message || "Load error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!auth) return; // wait for auth to resolve
    fetchToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  // ---- form handlers ----
  const setField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSelectDefect = (defect) => {
    if (!defect) return;
    setForm((prev) => {
      const currentDefects = prev.selectedDefects || [];
      if (!currentDefects.some((d) => d.name === defect)) {
        return {
          ...prev,
          selectedDefects: [
            ...currentDefects,
            { name: defect, quantity: "" },
          ],
        };
      }
      return prev;
    });
  };

  const handleDefectQty = (index, value) => {
    setForm((prev) => {
      const list = [...(prev.selectedDefects || [])];
      list[index].quantity = value;
      return { ...prev, selectedDefects: list };
    });
  };

  const removeDefect = (index) => {
    setForm((prev) => {
      const list = [...(prev.selectedDefects || [])];
      list.splice(index, 1);
      return { ...prev, selectedDefects: list };
    });
  };

  const resetForm = () =>
    setForm({
      hour: "",
      selectedDefects: [],
      inspectedQty: "",
      passedQty: "",
      defectivePcs: "",
      afterRepair: "",
    });

  // ---- validation ----
  const validate = () => {
    if (!form.hour) return "Please select Working Hour.";
    return "";
  };

  // ---- POST ----
  const buildEntryPayload = () => ({
    hour: form.hour,
    inspectedQty: Number(form.inspectedQty || 0),
    passedQty: Number(form.passedQty || 0),
    defectivePcs: Number(form.defectivePcs || 0),
    afterRepair: Number(form.afterRepair || 0),
    selectedDefects: (form.selectedDefects || []).map((d) => ({
      name: d.name,
      quantity: Number(d.quantity || 0),
    })),
    // optionally: lineInfo: { buyer, building, floor, line, registerId }
  });

  const save = async () => {
    const msg = validate();
    if (msg) {
      alert(`❌ Validation Error\n\n${msg}`);
      return;
    }
    if (!userId && !userName) {
      alert("❌ Missing user identity (auth).");
      return;
    }

    try {
      setSaving(true);
      const res = await fetch("/api/hourly-inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,                 // preferred (server-side filter friendly)
          userName: userName,             // label stored in row.user
          entries: [buildEntryPayload()], // single entry
          reportDate: new Date().toISOString(), // ensure today's bucket
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to save");

      // refresh right panel
      await fetchToday();
      resetForm();
      alert("✅ Saved!");
    } catch (e) {
      alert(`❌ Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ---- aggregates ----
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.inspectedQty += Number(r.inspectedQty || 0);
        acc.passedQty += Number(r.passedQty || 0);
        acc.defectivePcs += Number(r.defectivePcs || 0);
        acc.afterRepair += Number(r.afterRepair || 0);
        acc.totalDefects += Number(r.totalDefects || 0);
        return acc;
      },
      {
        inspectedQty: 0,
        passedQty: 0,
        defectivePcs: 0,
        afterRepair: 0,
        totalDefects: 0,
      }
    );
  }, [rows]);

  const passRate =
    totals.inspectedQty > 0
      ? ((totals.passedQty / totals.inspectedQty) * 100).toFixed(1)
      : "—";

  // ---- UI ----
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">
              Endline Hourly Dashboard — <span className="text-indigo-600">{userName}</span>
            </h1>
            <p className="text-sm text-gray-600">Today: {todayLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchToday}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-100"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* LEFT: fixed single form */}
          <div className="md:sticky md:top-4 md:h-fit">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-gray-700">Add/Update Hour</h2>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Working Hour
                </label>
                <select
                  value={form.hour}
                  onChange={(e) => setField("hour", e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Select Hour</option>
                  {hourOptions.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  Add Defect
                </label>
                <select
                  onChange={(e) => {
                    handleSelectDefect(e.target.value);
                    e.target.value = "";
                  }}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="">Select defect</option>
                  {defectOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {form.selectedDefects.length > 0 && (
                <div className="mb-3 space-y-1">
                  {form.selectedDefects.map((d, i) => (
                    <div
                      key={`${d.name}-${i}`}
                      className="flex items-center gap-2 rounded border border-gray-200 bg-gray-50 px-2 py-1"
                    >
                      <span className="flex-1 truncate text-xs font-medium text-gray-700">
                        {d.name}
                      </span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Qty"
                        value={d.quantity}
                        onChange={(e) => handleDefectQty(i, e.target.value)}
                        className="w-16 rounded border border-gray-300 px-1 py-0.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeDefect(i)}
                        className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-700 hover:bg-gray-200"
                        title="Remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Inspected Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.inspectedQty}
                    onChange={(e) => setField("inspectedQty", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Passed Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.passedQty}
                    onChange={(e) => setField("passedQty", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    Defective Pcs
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.defectivePcs}
                    onChange={(e) => setField("defectivePcs", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-700">
                    After Repair
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.afterRepair}
                    onChange={(e) => setField("afterRepair", e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-100"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: today's entries */}
          <div>
            <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <div className="text-xs text-gray-500">Inspected</div>
                <div className="text-lg font-semibold">{totals.inspectedQty}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <div className="text-xs text-gray-500">Passed</div>
                <div className="text-lg font-semibold">{totals.passedQty}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <div className="text-xs text-gray-500">Defects</div>
                <div className="text-lg font-semibold">{totals.totalDefects}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                <div className="text-xs text-gray-500">Pass Rate</div>
                <div className="text-lg font-semibold">{passRate}%</div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">
                  Today’s Entries ({rows.length})
                </h2>
                {loading && <span className="text-xs text-gray-500">Loading...</span>}
              </div>

              {rows.length === 0 ? (
                <div className="rounded border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No entries yet for {todayLabel}.
                </div>
              ) : (
                <ul className="space-y-3">
                  {rows.map((r) => (
                    <li
                      key={r._id}
                      className="rounded border border-gray-200 p-3 hover:bg-gray-50"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-800">
                          {r.hourLabel}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(r.updatedAt || r.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-700 md:grid-cols-5">
                        <div><span className="text-gray-500">Inspected:</span> {r.inspectedQty}</div>
                        <div><span className="text-gray-500">Passed:</span> {r.passedQty}</div>
                        <div><span className="text-gray-500">Def.Pcs:</span> {r.defectivePcs}</div>
                        <div><span className="text-gray-500">After Repair:</span> {r.afterRepair}</div>
                        <div><span className="text-gray-500">Total Defects:</span> {r.totalDefects}</div>
                      </div>
                      {Array.isArray(r.selectedDefects) && r.selectedDefects.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {r.selectedDefects.map((d, i) => (
                            <span
                              key={`${d.name}-${i}`}
                              className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                            >
                              {d.name}: {d.quantity}
                            </span>
                          ))}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
