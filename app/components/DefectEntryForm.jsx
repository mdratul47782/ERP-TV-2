"use client";

import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth"; // আপনার পাথ অনুযায়ী ঠিক করুন

export default function DefectFullForm({ id }) {
  const { auth } = useAuth();

  const [hours, setHours] = useState([
    {
      id: 1,
      hour: "",
      selectedDefects: [],
      totalDefects: "",
      defectivePcs: "",
      inspectedQty: "",
      passedQty: "",
      afterRepair: "",
    },
  ]);

  const defectOptions = [
    "Stitch Skip",
    "Broken Stitch",
    "Oil Stain",
    "Open Seam",
    "Measurement Issue",
  ];

  const hourOptions = [
    "1st Hour","2nd Hour","3rd Hour","4th Hour","5th Hour","6th Hour",
    "7th Hour","8th Hour","9th Hour","10th Hour","11th Hour","12th Hour",
  ];

  // ---- handlers ----
  const handleSelectDefect = (hourIndex, defect) => {
    if (!defect) return;
    setHours((prev) => {
      const updated = [...prev];
      const currentDefects = updated[hourIndex].selectedDefects || [];
      if (!currentDefects.some((d) => d.name === defect)) {
        updated[hourIndex].selectedDefects = [
          ...currentDefects,
          { name: defect, quantity: "" },
        ];
      }
      return updated;
    });
  };

  const handleQuantityChange = (hourIndex, defectIndex, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[hourIndex].selectedDefects[defectIndex].quantity = value;
      return updated;
    });
  };

  const handleRemoveDefect = (hourIndex, defectIndex) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[hourIndex].selectedDefects = updated[hourIndex].selectedDefects.filter(
        (_, i) => i !== defectIndex
      );
      return updated;
    });
  };

  const handleClearAllDefects = (hourIndex) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[hourIndex].selectedDefects = [];
      return updated;
    });
  };

  const handleHourChange = (index, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[index].hour = value;
      return updated;
    });
  };

  const handleTotalDefectsChange = (index, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[index].totalDefects = value;
      return updated;
    });
  };

  const handleDefectivePcsChange = (index, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[index].defectivePcs = value;
      return updated;
    });
  };

  const handleInspectedQtyChange = (index, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[index].inspectedQty = value;
      return updated;
    });
  };

  const handlePassedQtyChange = (index, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[index].passedQty = value;
      return updated;
    });
  };

  const handleAfterRepairChange = (index, value) => {
    setHours((prev) => {
      const updated = [...prev];
      updated[index].afterRepair = value;
      return updated;
    });
  };

  const addHour = () => {
    setHours((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        hour: "",
        selectedDefects: [],
        totalDefects: "",
        defectivePcs: "",
        inspectedQty: "",
        passedQty: "",
        afterRepair: "",
      },
    ]);
  };

  // ---- validation (equality condition removed) ----
  const validateHourData = (hourData) => {
    if (!hourData.hour) {
      return { valid: false, message: "Please select Working Hour." };
    }
    // ❌ equality check removed
    return { valid: true };
  };

  // ---- payload & fetch ----
  const buildEntryPayload = (h) => ({
    hour: h.hour,
    inspectedQty: Number(h.inspectedQty || 0),
    passedQty: Number(h.passedQty || 0),
    defectivePcs: Number(h.defectivePcs || 0),
    afterRepair: Number(h.afterRepair || 0),
    selectedDefects: (h.selectedDefects || []).map((d) => ({
      name: d.name,
      quantity: Number(d.quantity || 0),
    })),
    // চাইলে lineInfo এখানে যোগ করো
    // lineInfo: { buyer, building, floor, line, registerId }
  });

  const postEntries = async (entries) => {
    const res = await fetch("/api/hourly-inspections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: id,                          // URL params থেকে user ObjectId
        userName: auth?.user_name || "User", // context থেকে user name
        entries,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to save");
    return data;
  };

  const handleSaveHour = async (hourIndex) => {
    const hourData = hours[hourIndex];
    const validation = validateHourData(hourData);
    if (!validation.valid) {
      alert(`❌ Validation Error!\n\n${validation.message}`);
      return;
    }

    try {
      const payload = buildEntryPayload(hourData);
      const resp = await postEntries([payload]);
      console.log("Saved hour data:", resp);
      alert(`✅ Hour ${hourIndex + 1} saved!`);
    } catch (e) {
      alert(`❌ Save failed: ${e.message}`);
    }
  };

  const handleSave = async () => {
    for (let i = 0; i < hours.length; i++) {
      const validation = validateHourData(hours[i]);
      if (!validation.valid) {
        alert(`❌ Validation Error in Hour ${i + 1}!\n\n${validation.message}`);
        return;
      }
    }

    try {
      const entries = hours.map(buildEntryPayload);
      const resp = await postEntries(entries);
      console.log("Saved all hours:", resp);
      alert(`✅ Saved ${resp.count} hour entries!`);
    } catch (e) {
      alert(`❌ Save failed: ${e.message}`);
    }
  };

  // ---- UI ----
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-9xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {hours.map((hour, hourIndex) => (
              <div key={hour.id} className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-lg p-4 shadow-md">
                {/* 1. Working Hour */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-3 mb-3">
                  <label className="block font-bold text-xs mb-2">Working Hour</label>
                  <select
                    value={hour.hour}
                    onChange={(e) => handleHourChange(hourIndex, e.target.value)}
                    className="w-full border-2 border-white rounded-md px-2 py-1.5 text-sm text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">Select Hour</option>
                    {hourOptions.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                {/* 2. Defect Type */}
                <div className="mb-3">
                  <label className="block font-semibold text-xs text-gray-700 mb-1">Defect Type</label>
                  <select
                    onChange={(e) => { handleSelectDefect(hourIndex, e.target.value); e.target.value = ""; }}
                    className="w-full border-2 border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select defect</option>
                    {defectOptions.map((defect, i) => (
                      <option key={i} value={defect}>{defect}</option>
                    ))}
                  </select>
                </div>

                {/* Selected Defects */}
                {hour.selectedDefects.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {hour.selectedDefects.map((defect, defectIndex) => (
                      <div key={defectIndex} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded px-2 py-1">
                        <span className="text-xs font-medium text-red-700 flex-1 truncate">{defect.name}</span>
                        <input
                          type="number" min="0" placeholder="Qty" value={defect.quantity}
                          onChange={(e) => handleQuantityChange(hourIndex, defectIndex, e.target.value)}
                          className="w-14 border border-red-300 rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveDefect(hourIndex, defectIndex)}
                          className="text-red-700 hover:text-white hover:bg-red-600 border border-red-300 rounded px-2 py-0.5 text-xs"
                          title="Remove"
                        >×</button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleClearAllDefects(hourIndex)}
                      className="mt-1 text-xs text-red-700 hover:text-white hover:bg-red-600 border border-red-300 rounded px-2 py-0.5"
                    >Clear All</button>
                  </div>
                )}

                {/* Inputs */}
                <div className="space-y-2">
                  <div>
                    <label className="block font-semibold text-xs text-gray-700 mb-1">Total Defects</label>
                    <input
                      type="number" min="0" placeholder="Enter total defects" value={hour.totalDefects}
                      onChange={(e) => handleTotalDefectsChange(hourIndex, e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-xs text-gray-700 mb-1">Defective Pieces</label>
                    <input
                      type="number" min="0" placeholder="Enter defective pieces" value={hour.defectivePcs}
                      onChange={(e) => handleDefectivePcsChange(hourIndex, e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-xs text-gray-700 mb-1">Inspected Quantity</label>
                    <input
                      type="number" min="0" placeholder="Enter inspected qty" value={hour.inspectedQty}
                      onChange={(e) => handleInspectedQtyChange(hourIndex, e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-xs text-gray-700 mb-1">Passed Quantity</label>
                    <input
                      type="number" min="0" placeholder="Enter passed qty" value={hour.passedQty}
                      onChange={(e) => handlePassedQtyChange(hourIndex, e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-xs text-gray-700 mb-1">RCV After Repair Pieces</label>
                    <input
                      type="number" min="0" placeholder="Enter after repair" value={hour.afterRepair}
                      onChange={(e) => handleAfterRepairChange(hourIndex, e.target.value)}
                      className="w-full border-2 border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveHour(hourIndex)}
                  className="w-full mt-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md text-xs"
                >
                  💾 Save Hour Data
                </button>
              </div>
            ))}
          </div>

          {hours.length < 12 && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={addHour}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md"
              >
                ➕ Add Data For Another Hour ({hours.length}/12)
              </button>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md"
            >
              ✅ Save All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
