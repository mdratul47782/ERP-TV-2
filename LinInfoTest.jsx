"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Image from "next/image";
import { Search, Trash2, Save, PlusSquare, BarChart } from "lucide-react";

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
  const [saving, setSaving] = useState(false);

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

  const validate = () => {
    const keys = [
      "buyer",
      "building",
      "floor",
      "line",
      "style",
      "item",
      "color",
      "smv",
      "runDay",
    ];
    for (const k of keys) if (!formValues[k]) return false;
    return true;
  };

  const handleSave = async () => {
    if (!auth) return alert("Please login before submitting this form.");
    if (!validate()) return alert("Please fill in all fields.");

    setSaving(true);
    try {
      const data = { ...formValues, created_by: auth?.user_name || "Unknown" };
      const method = existingRecord ? "PUT" : "POST";
      const body = existingRecord ? { ...data, id: existingRecord._id } : data;

      const res = await fetch("/api/register", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await res.json();
      alert(result.message || "Saved!");

      if (result.success) fetchUserRecord();
    } catch (err) {
      console.error(err);
      alert("Save failed. Check console for details.");
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!existingRecord) return;
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const res = await fetch(
        `/api/register?id=${existingRecord._id}&created_by=${auth.user_name}`,
        { method: "DELETE" }
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
    } catch (err) {
      console.error(err);
      alert("Delete failed. Check console for details.");
    }
  };

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

  const buildings = ["Building A", "Building B", "Building C", "Building D", "Building E"];
  const floors = ["A-2", "B-2", "A-3", "B-3", "A-4", "B-4", "A-5", "B-5"];
  const lines = Array.from({ length: 15 }, (_, i) => `Line ${i + 1}`);

  if (loading) {
    return (
      <section className="max-w-3xl mx-auto bg-white border border-gray-200 min-h-[400px] shadow-lg rounded-lg mt-12 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading...</div>
      </section>
    );
  }

  return (
    <section className="max-w-4xl mx-auto bg-white border border-gray-200 shadow-xl rounded-2xl mt-2 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-600 text-white">
        <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
          <Image src="/1630632533544 (2).jpg" alt="HKD" width={64} height={64} priority />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">HKD Outdoor Innovations Ltd.</h2>
          <p className="text-sm opacity-90">Line Information Registration</p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90 hidden sm:inline">{auth ? `Logged in as ${auth.user_name}` : "Not logged in"}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Preview / Quick actions */}
        <aside className="space-y-4">
          <div className="bg-gradient-to-br from-white to-slate-50 p-4 rounded-2xl border shadow-sm">
            <h3 className="font-semibold text-gray-700">Quick Preview</h3>
            <dl className="mt-3 text-sm text-gray-600">
              <div className="flex justify-between py-1">
                <dt>Buyer</dt>
                <dd className="font-medium">{formValues.buyer || "—"}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt>Building</dt>
                <dd className="font-medium">{formValues.building || "—"}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt>Floor</dt>
                <dd className="font-medium">{formValues.floor || "—"}</dd>
              </div>
              <div className="flex justify-between py-1">
                <dt>Line</dt>
                <dd className="font-medium">{formValues.line || "—"}</dd>
              </div>
            </dl>

            <div className="mt-4 flex gap-2">
              <button onClick={() => window.open(`/DailyInProcessedEndLineInspectionReport/${auth?.id}`, "_blank")} className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"> 
                <BarChart size={16} />
                <span className="text-sm">View Daily Report</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-white shadow-sm flex items-center gap-3">
            <div className="flex-1 text-sm text-gray-600">Add image / video for this line (optional)</div>
            <a href="/ImageVideoLinkPage" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
              <PlusSquare size={16} />
              <span className="hidden sm:inline">Add</span>
            </a>
          </div>
        </aside>

        {/* Right column: Form */}
        <form className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <Field label="Register Buyer">
            <SearchableDropdown options={buyers} value={formValues.buyer} onChange={(val) => setFormValues({ ...formValues, buyer: val })} placeholder="Select buyer" />
          </Field>

          <Field label="Register Building">
            <SearchableDropdown options={buildings} value={formValues.building} onChange={(val) => setFormValues({ ...formValues, building: val })} placeholder="Select building" />
          </Field>

          <Field label="Register Floor">
            <SearchableDropdown options={floors} value={formValues.floor} onChange={(val) => setFormValues({ ...formValues, floor: val })} placeholder="Select floor" />
          </Field>

          <Field label="Register Line">
            <SearchableDropdown options={lines} value={formValues.line} onChange={(val) => setFormValues({ ...formValues, line: val })} placeholder="Select line" />
          </Field>

          <Field label="Style Number">
            <input type="text" placeholder="Enter style number" value={formValues.style} onChange={(e) => setFormValues({ ...formValues, style: e.target.value })} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none" />
          </Field>

          <Field label="Style/Item Description">
            <input type="text" placeholder="Enter item description" value={formValues.item} onChange={(e) => setFormValues({ ...formValues, item: e.target.value })} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none" />
          </Field>

          <Field label="Color/Model">
            <input type="text" placeholder="Enter color/model" value={formValues.color} onChange={(e) => setFormValues({ ...formValues, color: e.target.value })} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none" />
          </Field>

          <Field label="SMV">
            <input type="number" step="0.01" placeholder="Enter SMV" value={formValues.smv} onChange={(e) => setFormValues({ ...formValues, smv: e.target.value })} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none" />
          </Field>

          <Field label="Run Day">
            <input type="text" placeholder="Enter run day" value={formValues.runDay} onChange={(e) => setFormValues({ ...formValues, runDay: e.target.value })} className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-sky-400 outline-none" />
          </Field>

          <div className="md:col-span-2 flex items-center justify-between gap-3 mt-2">
            <div className="flex gap-2">
              {existingRecord && (
                <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                  <Trash2 size={16} /> Delete
                </button>
              )}

              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg">
                <Save size={16} /> {existingRecord ? "Update Information" : "Save Information"}
              </button>
            </div>

            <div className="flex gap-2">
              <a href="/ImageVideoLinkPage" className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
                <PlusSquare size={16} /> Add Image/Video
              </a>

              <a href={`/DailyInProcessedEndLineInspectionReport/${auth?.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg">
                <BarChart size={16} /> View Daily Report
              </a>
            </div>
          </div>
        </form>
      </div>

      <div className="px-6 py-4 bg-gray-50 text-right text-sm text-gray-600 border-t">• HKD OUTDOOR INNOVATIONS LTD.</div>
    </section>
  );
}


/* ---------- Small presentational helpers ---------- */
function Field({ label, children }) {
  return (
    <label className="flex flex-col text-sm text-gray-700">
      <span className="mb-2 font-medium">{label}</span>
      {children}
    </label>
  );
}

function SearchableDropdown({ options, value, onChange, placeholder }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? options.filter((opt) => opt.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          placeholder={placeholder}
          value={query || value}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          className="w-full rounded-lg border px-3 py-2 pr-10 focus:ring-2 focus:ring-sky-400 outline-none"
        />

        <div className="absolute right-2 top-2 text-gray-400">
          <Search size={16} />
        </div>
      </div>

      {open && (
        <ul className="absolute z-50 mt-2 max-h-48 w-full overflow-auto rounded-lg border bg-white shadow-lg text-sm">
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li key={opt} onMouseDown={() => { onChange(opt); setQuery(opt); setOpen(false); }} className={`cursor-pointer px-3 py-2 hover:bg-sky-600 hover:text-white ${opt === value ? "bg-sky-100" : ""}`}>
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
