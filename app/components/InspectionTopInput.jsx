"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function InputRow() {
  const { auth } = useAuth();

  const [form, setForm] = useState({
    building: "",
    floor: "",
    line: "",
    buyer: "",
    style: "",
    item: "",
    color: "",
  });

  const [saved, setSaved] = useState(null);     // holds the last saved/updated row (shows in box)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Prefill buyer from auth once, if available
  useEffect(() => {
    if (auth?.user_name) {
      setForm(f => ({ ...f, buyer: f.buyer || auth.user_name }));
    }
  }, [auth?.user_name]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  async function handlePost() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/rows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // works if you use cookie-based auth; harmless otherwise
        body: JSON.stringify({
          ...form,
          // attach minimal user info; do NOT send password
          createdBy: auth?.user_name || "anonymous",
          userId: auth?.id,
        }),
      });

      if (!res.ok) throw new Error(`POST failed (${res.status})`);
      const data = await res.json();
      setSaved(data); // show in box
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handlePatch() {
    if (!saved?.id) return; // nothing to patch yet
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/rows/${saved.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
      const data = await res.json();
      setSaved(data); // refresh box with updated values
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      building: "",
      floor: "",
      line: "",
      buyer: auth?.user_name || "",
      style: "",
      item: "",
      color: "",
    });
  }

  return (
    <div className="w-full overflow-x-auto">
      {/* Tip: avoid logging sensitive info like passwords */}
      {/* console.log("Authenticated user info:", auth); */}

      <table className="border border-gray-400 w-full text-center">
        <thead>
          <tr className="bg-gray-100 text-sm">
            <th className="border border-gray-400 px-2 py-1">Building</th>
            <th className="border border-gray-400 px-2 py-1">Floor</th>
            <th className="border border-gray-400 px-2 py-1">Line</th>
            <th className="border border-gray-400 px-2 py-1">Buyer</th>
            <th className="border border-gray-400 px-2 py-1">Style</th>
            <th className="border border-gray-400 px-2 py-1">Item</th>
            <th className="border border-gray-400 px-2 py-1">Color</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            {[
              ["building", form.building],
              ["floor", form.floor],
              ["line", form.line],
              ["buyer", form.buyer],
              ["style", form.style],
              ["item", form.item],
              ["color", form.color],
            ].map(([name, value]) => (
              <td key={name} className="border border-gray-400 p-1">
                <input
                  type="text"
                  name={name}
                  value={value}
                  onChange={onChange}
                  className="w-full border border-gray-300 rounded px-1 py-0.5 focus:outline-none"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={handlePost}
          disabled={loading}
          className="px-3 py-1 rounded border text-sm bg-blue-600 text-white disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save (POST)"}
        </button>

        <button
          onClick={handlePatch}
          disabled={loading || !saved?.id}
          className="px-3 py-1 rounded border text-sm bg-emerald-600 text-white disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update (PATCH)"}
        </button>

        <button
          onClick={resetForm}
          disabled={loading}
          className="px-3 py-1 rounded border text-sm bg-gray-100"
        >
          Reset
        </button>
      </div>

      {err && (
        <div className="mt-3 text-sm text-red-600">
          {err}
        </div>
      )}

      {/* Box that shows the saved/updated data */}
      {saved && (
        <div className="mt-4 rounded border bg-white shadow-sm">
          <div className="px-3 py-2 border-b bg-gray-50 text-xs text-gray-600">
            Saved Row • <span className="font-medium">ID:</span> {saved.id}
          </div>
          <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
            <div><span className="font-medium">Building:</span> {saved.building}</div>
            <div><span className="font-medium">Floor:</span> {saved.floor}</div>
            <div><span className="font-medium">Line:</span> {saved.line}</div>
            <div><span className="font-medium">Buyer:</span> {saved.buyer}</div>
            <div><span className="font-medium">Style:</span> {saved.style}</div>
            <div><span className="font-medium">Item:</span> {saved.item}</div>
            <div><span className="font-medium">Color:</span> {saved.color}</div>
            <div className="col-span-full text-xs text-gray-500">
              Created by: {saved.createdBy || "-"} {saved.createdAt ? `• ${new Date(saved.createdAt).toLocaleString()}` : ""}
              {saved.updatedAt ? ` • Updated: ${new Date(saved.updatedAt).toLocaleString()}` : ""}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
