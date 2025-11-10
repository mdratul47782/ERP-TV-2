"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function LineInfo() {
  const { auth } = useAuth();
  const router = useRouter();
console.log("here is auth", auth);
  const [formValues, setFormValues] = useState({
    buyer: "",
    building: "",
    floor: "",
    line: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!auth) {
      alert("Please login before submitting this form.");
      router.push("/login");
      return;
    }

    const data = {
      ...formValues,
      created_by: auth?.user_name || "Unknown",
    };

    console.log("Sending data to API:", data);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    alert(result.message || "Saved!");
  };

  // Dummy dropdown data
  const buyers = [
    "Buyer A", "Buyer B", "Buyer C", "Buyer D", "Buyer E",
    "Buyer F", "Buyer G", "Buyer H", "Buyer I", "Buyer J",
  ];
  const buildings = ["Building A", "Building B", "Building C", "Building D", "Building E"];
  const floors = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor", "4th Floor"];
  const lines = [
    "Line 1", "Line 2", "Line 3", "Line 4", "Line 5",
    "Line 6", "Line 7", "Line 8", "Line 9", "Line 10",
  ];

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 min-h-[550px] shadow-lg rounded-lg mt-12 text-gray-800">
      {/* Header */}
      <div className="flex items-center bg-gradient-to-br from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-lg">
        <Image
          src="/1630632533544 (2).jpg"
          alt="HKD Logo"
          width={45}
          height={45}
          className="mr-3 rounded-md"
        />
        <div>
          <h1 className="text-2xl font-semibold leading-tight">
            HKD Outdoor Innovations Ltd.
          </h1>
          <p className="text-lg opacity-90">Line Information Registration</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-5 px-8 py-8 relative"
      >
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

        {/* Save Button */}
        <div className="col-span-2 flex justify-between pt-6">
          {/* Left Button: Navigate to Report */}
          <a
  href={`/DailyInProcessedEndLineInspectionReport/${auth?.id}`}
  target="_blank"
  rel="noopener noreferrer"
  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition-all duration-200 text-lg"
>
  📊 View Daily Report
</a>


          {/* Right Button: Save Info */}
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md shadow-md transition-all duration-200 text-lg"
          >
            💾 Save Information
          </button>
        </div>
      </form>

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
      {/* Input box */}
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
        onBlur={() => setTimeout(() => setOpen(false), 150)} // small delay to allow selection click
      />

      {/* Dropdown options */}
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
            <li className="px-3 py-2 text-gray-500 italic">No results found</li>
          )}
        </ul>
      )}
    </div>
  );
}
