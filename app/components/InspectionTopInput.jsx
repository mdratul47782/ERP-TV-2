"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";

function todayYYYYMMDD() {
  return new Date().toISOString().slice(0, 10);
}

const initialForm = {
  building: "",
  floor: "",
  line: "",
  buyer: "",
  style: "",
  item: "",
  color: "",
};

export default function InputRow() {
  const { auth } = useAuth();

  const [form, setForm] = useState(initialForm);
  const [record, setRecord] = useState(null); // সেভড ডকুমেন্ট
  const [editing, setEditing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const theDate = useMemo(() => todayYYYYMMDD(), []);

  // প্রথম লোডে আজকের টপ ইনপুট লোড
  useEffect(() => {
    const load = async () => {
      if (!auth?.id) return;
      try {
        setLoading(true);
        setErr("");
        const qs = new URLSearchParams({ userId: auth.id, date: theDate });
        const res = await fetch(`/api/inspection-top?${qs.toString()}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load");
        const first = (json.data || [])[0] || null;
        if (first) {
          setRecord(first);
          setForm({
            building: first.building || "",
            floor: first.floor || "",
            line: first.line || "",
            buyer: first.buyer || "",
            style: first.style || "",
            item: first.item || "",
            color: first.color || "",
          });
          setEditing(false); // সেভড থাকলে ভিউ মোড
        } else {
          setEditing(true); // না থাকলে এডিট মোড
        }
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [auth?.id, theDate]);

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const onSave = async () => {
    if (!auth?.id) {
      alert("Please login first.");
      return;
    }
    setLoading(true);
    try {
      // নতুন হলে POST (upsert), নাহলে PUT
      const isUpdate = !!record?._id;
      const url = isUpdate ? `/api/inspection-top/${record._id}` : "/api/inspection-top";
      const method = isUpdate ? "PUT" : "POST";

      const payload = isUpdate
        ? { ...form } // PUT-এ শুধু ফিল্ডগুলো
        : { userId: auth.id, userName: auth.user_name, ...form, reportDate: theDate };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Save failed");

      const doc = json.data;
      setRecord(doc);
      setForm({
        building: doc.building || "",
        floor: doc.floor || "",
        line: doc.line || "",
        buyer: doc.buyer || "",
        style: doc.style || "",
        item: doc.item || "",
        color: doc.color || "",
      });
      setEditing(false);
      alert("✅ Saved!");
    } catch (e) {
      alert(`❌ Save failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onEdit = () => setEditing(true);

  const onCancel = () => {
    if (record) {
      // আগের সেভড ভ্যালুতে রিসেট
      setForm({
        building: record.building || "",
        floor: record.floor || "",
        line: record.line || "",
        buyer: record.buyer || "",
        style: record.style || "",
        item: record.item || "",
        color: record.color || "",
      });
      setEditing(false);
    } else {
      setForm(initialForm);
      setEditing(true);
    }
  };

  const onDelete = async () => {
    if (!record?._id) return;
    if (!confirm("Delete this header info?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inspection-top/${record._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Delete failed");
      setRecord(null);
      setForm(initialForm);
      setEditing(true);
      alert("🗑️ Deleted.");
    } catch (e) {
      alert(`❌ Delete failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      {/* টপ বার */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">
          {auth ? (
            <>
              Logged in as: <b>{auth.user_name}</b> &middot; <span>{theDate}</span>
            </>
          ) : (
            <span className="text-red-600">Please login</span>
          )}
        </div>

        <div className="space-x-2">
          {editing ? (
            <>
              <button
                onClick={onSave}
                disabled={loading || !auth}
                className="px-3 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancel}
                className="px-3 py-1 rounded border text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onEdit}
                className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
              >
                Edit
              </button>
              {record?._id && (
                <button
                  onClick={onDelete}
                  className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* ইনপুট টেবিল (এডিটিংয়ের সময় সক্রিয়) */}
      <table className="border border-gray-400 min-w-[900px] text-center">
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
            {["building", "floor", "line", "buyer", "style", "item", "color"].map((key) => (
              <td key={key} className="border border-gray-400 p-1">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded px-1 py-0.5 focus:outline-none disabled:bg-gray-100"
                  value={form[key]}
                  onChange={onChange(key)}
                  disabled={!editing}
                  placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* সেভড কার্ড (ভিউ মোডে) */}
      {!editing && record && (
        <div className="mt-3 bg-white border rounded-lg p-3 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Building:</span> <b>{record.building || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Floor:</span> <b>{record.floor || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Line:</span> <b>{record.line || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Buyer:</span> <b>{record.buyer || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Style:</span> <b>{record.style || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Item:</span> <b>{record.item || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Color:</span> <b>{record.color || "-"}</b>
            </div>
            <div className="bg-gray-50 p-2 rounded">
              <span className="text-gray-600">Date:</span>{" "}
              <b>{new Date(record.reportDate).toISOString().slice(0, 10)}</b>
            </div>
          </div>
        </div>
      )}

      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
    </div>
  );
}
