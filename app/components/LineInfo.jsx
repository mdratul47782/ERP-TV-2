"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import Image from "next/image";

export default function LineInfo() {
  const { auth } = useAuth();

  const [formValues, setFormValues] = useState({
    buyer: "",
    building: "",
    floor: "",
    line: "",
    style: "",
    item: "",
    color: "",
    smv: "",
    runDay: "",
  });

  const [existingRecord, setExistingRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's record on mount
  useEffect(() => {
    fetchUserRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserRecord = async () => {
    if (!auth) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/register?created_by=${auth.user_name}`);
      const result = await res.json();

      if (result.success && result.data.length > 0) {
        // Load the first (and only) record
        const record = result.data[0];
        setExistingRecord(record);
        setFormValues({
          buyer: record.buyer || "",
          building: record.building || "",
          floor: record.floor || "",
          line: record.line || "",
          style: record.style || "",
          item: record.item || "",
          color: record.color || "",
          smv: record.smv || "",
          runDay: record.runDay || "",
        });
      }
    } catch (err) {
      console.error("Error fetching record:", err);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!auth) {
      alert("Please login before submitting this form.");
      return;
    }

    // Validate all fields
    if (
      !formValues.buyer ||
      !formValues.building ||
      !formValues.floor ||
      !formValues.line ||
      !formValues.style ||
      !formValues.item ||
      !formValues.color ||
      !formValues.smv ||
      !formValues.runDay
    ) {
      alert("Please fill in all fields");
      return;
    }

    const data = {
      ...formValues,
      created_by: auth?.user_name || "Unknown",
    };

    const method = existingRecord ? "PUT" : "POST";
    const body = existingRecord ? { ...data, id: existingRecord._id } : data;

    const res = await fetch("/api/register", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();
    alert(result.message || "Saved!");

    if (result.success) {
      fetchUserRecord();
    }
  };

  const handleDelete = async () => {
    if (!existingRecord) return;

    if (!confirm("Are you sure you want to delete this record?")) return;

    const res = await fetch(
      `/api/register?id=${existingRecord._id}&created_by=${auth.user_name}`,
      {
        method: "DELETE",
      }
    );

    const result = await res.json();
    alert(result.message);

    if (result.success) {
      setExistingRecord(null);
      setFormValues({
        buyer: "",
        building: "",
        floor: "",
        line: "",
        style: "",
        item: "",
        color: "",
        smv: "",
        runDay: "",
      });
    }
  };

  // ✅ Updated dropdown data
  const buyers = [
    "Decathlon - knit",
    "Decathlon - woven",
    "walmart",
    "Columbia",
    "ZXY",
    "CTC",
    "DIESEL",
    "Sports Group Denmark",
    "Identity",
    "Fifth Avenur",
  ];

  const buildings = [
    "Building A",
    "Building B",
    "Building C",
    "Building D",
    "Building E",
  ];

  // ✅ Updated floor options
  const floors = ["A-2", "B-2", "A-3", "B-3", "A-4", "B-4", "A-5", "B-5"];

  const lines = [
    "Line 1",
    "Line 2",
    "Line 3",
    "Line 4",
    "Line 5",
    "Line 6",
    "Line 7",
    "Line 8",
    "Line 9",
    "Line 10",
    "Line 11",
    "Line 12",
    "Line 13",
    "Line 14",
    "Line 15",
  ];

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto bg-white border border-gray-200 min-h-[550px] shadow-lg rounded-lg mt-12 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 min-h-[350px] shadow-lg rounded-lg mt-4 text-gray-800">
      {/* Header */}
      <div className="flex items-center bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
        <div className="w-12 h-12 bg-white rounded-md mr-3 flex items-center justify-center">
          <Image
            src="/1630632533544 (2).jpg"
            alt="HKD Outdoor Innovations Ltd. Logo"
            width={80}
            height={80}
            className=""
            priority
          />
        </div>
        <div>
          <h1 className="text-2xl font-semibold leading-tight">
            HKD Outdoor Innovations Ltd.
          </h1>
          <p className="text-lg opacity-90">Line Information Registration</p>
        </div>
      </div>

      {/* Info Banner */}
      {existingRecord && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <span className="text-blue-800 text-sm font-medium">
            ℹ️ You have an existing record. Edit the fields below to update it.
          </span>
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-5 px-8 py-8">
        {/* Buyer */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Register Buyer:
        </label>
        <SearchableDropdown
          options={buyers}
          placeholder="Select Buyer"
          value={formValues.buyer}
          onChange={(val) => setFormValues({ ...formValues, buyer: val })}
        />

        {/* Building */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Register Building:
        </label>
        <SearchableDropdown
          options={buildings}
          placeholder="Select Building"
          value={formValues.building}
          onChange={(val) => setFormValues({ ...formValues, building: val })}
        />

        {/* Floor */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Register Floor:
        </label>
        <SearchableDropdown
          options={floors}
          placeholder="Select Floor"
          value={formValues.floor}
          onChange={(val) => setFormValues({ ...formValues, floor: val })}
        />

        {/* Line */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Register Line:
        </label>
        <SearchableDropdown
          options={lines}
          placeholder="Select Line"
          value={formValues.line}
          onChange={(val) => setFormValues({ ...formValues, line: val })}
        />

        {/* Style */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Style Number:
        </label>
        <input
          type="text"
          placeholder="Enter Style Number"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formValues.style}
          onChange={(e) =>
            setFormValues({ ...formValues, style: e.target.value })
          }
        />

        {/* Item */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Style/Item-Description:
        </label>
        <input
          type="text"
          placeholder="Enter Style/Item Description"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formValues.item}
          onChange={(e) =>
            setFormValues({ ...formValues, item: e.target.value })
          }
        />

        {/* Color */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Color/Model:
        </label>
        <input
          type="text"
          placeholder="Enter Color/Model"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formValues.color}
          onChange={(e) =>
            setFormValues({ ...formValues, color: e.target.value })
          }
        />

        {/* 🔹 SMV */}
        <label className="text-gray-700 font-medium text-sm pt-2">SMV:</label>
        <input
          type="text"
          placeholder="Enter SMV"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formValues.smv}
          onChange={(e) =>
            setFormValues({ ...formValues, smv: e.target.value })
          }
        />

        {/* 🔹 Run Day */}
        <label className="text-gray-700 font-medium text-sm pt-2">
          Run Day:
        </label>
        <input
          type="text"
          placeholder="Enter Run Day"
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={formValues.runDay}
          onChange={(e) =>
            setFormValues({ ...formValues, runDay: e.target.value })
          }
        />

        {/* Buttons */}
        <div className="col-span-2 flex justify-between pt-6 gap-3">
          {/* LEFT: Save / Update + Delete */}
          <div className="flex gap-2">
            {existingRecord && (
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 text-sm rounded-md shadow-sm transition duration-200 cursor-pointer"
              >
                🗑️ Delete
              </button>
            )}
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 text-sm rounded-md shadow-sm transition duration-200 cursor-pointer"
            >
              {existingRecord
                ? "💾 Update Information"
                : "💾 Save Information"}
            </button>
          </div>

          {/* RIGHT: add Image Video + View Daily Report */}
          <div className="flex gap-18">
            <a
              href="/HourlyProductionData"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 text-sm rounded-md shadow-sm transition duration-200 cursor-pointer"
            >
              Add Image Video
            </a>

            <a
              href={`/DailyInProcessedEndLineInspectionReport/${auth?.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1.5 text-sm rounded-md shadow-sm transition duration-200 cursor-pointer"
            >
              📊 View Daily Report
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-6 py-4 text-right text-base text-gray-600 rounded-b-lg border-t">
        {auth ? (
          <>
            Logged in as:{" "}
            <span className="font-semibold text-gray-800">
              {auth.user_name}
            </span>
          </>
        ) : (
          <span className="text-red-500 font-medium">
            You are not logged in
          </span>
        )}
      </div>
    </div>
  );
}

/* ✅ Custom Searchable Dropdown Component */
function SearchableDropdown({ options, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const filtered = query
    ? options.filter((opt) =>
        opt.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  return (
    <div className="relative">
      <input
        ref={ref}
        type="text"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        placeholder={placeholder}
        value={query || value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg text-sm">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li
                key={opt}
                onMouseDown={() => {
                  onChange(opt);
                  setQuery(opt);
                  setOpen(false);
                }}
                className={`cursor-pointer px-3 py-2 hover:bg-blue-600 hover:text-white ${
                  opt === value ? "bg-blue-100" : ""
                }`}
              >
                {opt}
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500 italic">
              No results found
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
