// app/components/ProductionInputForm.jsx
"use client";

import { useEffect, useState } from "react";
import ProductionSignInOut from "../components/auth/ProductionSignInOut";
import { useProductionAuth } from "../hooks/useProductionAuth";
import { useAuth } from "../hooks/useAuth";

export default function ProductionInputForm() {
  const { ProductionAuth, loading: productionLoading } = useProductionAuth();
  const { auth, loading: authLoading } = useAuth();

  // 🔹 Helper: local YYYY-MM-DD (client decides the day that operators see)
  const getLocalDateKey = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // 🔹 Main form state (includes smv)
  const [form, setForm] = useState({
    operatorTo: "",
    manpowerPresent: "",
    manpowerAbsent: "",
    workingHour: "",
    planQuantity: "",
    planEfficiency: "",
    todayTarget: "",
    achieve: "",
    smv: "",
  });

  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [headerId, setHeaderId] = useState(null);

  // 🔹 Map header doc → form state
  const fillFormFromHeader = (header) => {
    if (!header) return;
    setForm({
      operatorTo: header.operatorTo?.toString() ?? "",
      manpowerPresent: header.manpowerPresent?.toString() ?? "",
      manpowerAbsent: header.manpowerAbsent?.toString() ?? "",
      workingHour: header.workingHour?.toString() ?? "",
      planQuantity: header.planQuantity?.toString() ?? "",
      planEfficiency: header.planEfficiency?.toString() ?? "",
      todayTarget: header.todayTarget?.toString() ?? "",
      achieve: header.achieve?.toString() ?? "",
      smv: header.smv?.toString() ?? "",
    });
  };

  // 🔹 Reset form
  const resetForm = () =>
    setForm({
      operatorTo: "",
      manpowerPresent: "",
      manpowerAbsent: "",
      workingHour: "",
      planQuantity: "",
      planEfficiency: "",
      todayTarget: "",
      achieve: "",
      smv: "",
    });

  // 🔹 Load today's header for this production user
  useEffect(() => {
    if (productionLoading) return;
    if (!ProductionAuth?.id) return;

    const fetchToday = async () => {
      try {
        setLoadingExisting(true);
        setError("");
        setSuccess("");

        const dateKey = getLocalDateKey();
        const res = await fetch(
          `/api/production-headers?productionUserId=${ProductionAuth.id}&date=${dateKey}`
        );
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          fillFormFromHeader(json.data);
          setHeaderId(json.data._id);
        } else {
          // 🔹 No header for today → ensure blank inputs
          setHeaderId(null);
          resetForm();
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load today's production header");
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchToday();
  }, [productionLoading, ProductionAuth?.id]);

  // 🔹 Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 🔹 Snapshots (no password)
  const buildProductionUserSnapshot = () => {
    if (!ProductionAuth) return null;
    return {
      id: ProductionAuth.id,
      Production_user_name: ProductionAuth.Production_user_name,
      phone: ProductionAuth.phone,
      bio: ProductionAuth.bio,
    };
  };

  const buildQualityUserSnapshot = () => {
    if (!auth) return null;
    return {
      id: auth.id,
      user_name: auth.user_name,
      phone: auth.phone,
      bio: auth.bio,
    };
  };

  // 🔹 Save / Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!ProductionAuth?.id) {
      setError("Production user not authenticated.");
      return;
    }

    const isUpdate = Boolean(headerId);
    setSaving(true);

    try {
      const dateKey = getLocalDateKey();
      const payload = {
        ...form,
        productionUser: buildProductionUserSnapshot(),
        qualityUser: buildQualityUserSnapshot(),
        productionDate: dateKey, // 🔹 bind this record explicitly to "today"
      };

      const endpoint = isUpdate
        ? `/api/production-headers/${headerId}`
        : "/api/production-headers";
      const method = isUpdate ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg =
          json?.errors?.join(", ") ||
          json?.message ||
          (isUpdate
            ? "Failed to update production header"
            : "Failed to save production header");
        throw new Error(msg);
      }

      const saved = json.data;
      fillFormFromHeader(saved);
      setHeaderId(saved._id);

      setSuccess(
        isUpdate
          ? "Production header updated successfully."
          : "Production header saved successfully for today."
      );
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Delete header
  const handleDelete = async () => {
    if (!headerId) return;
    setError("");
    setSuccess("");
    setDeleting(true);

    try {
      const res = await fetch(`/api/production-headers/${headerId}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg =
          json?.message || "Failed to delete production header record";
        throw new Error(msg);
      }

      resetForm();
      setHeaderId(null);
      setSuccess("Production header deleted successfully.");
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong while deleting.");
    } finally {
      setDeleting(false);
    }
  };

  const busy =
    saving || deleting || loadingExisting || productionLoading || authLoading;

  const isExisting = Boolean(headerId);

  return (
    <div className="space-y-3">
      {/* Auth widget */}
      <ProductionSignInOut />

      {/* Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-200 bg-white/90 shadow-sm p-3 md:p-4 space-y-3"
      >
        {/* Title */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm md:text-base font-semibold text-slate-900">
            Production Header (Today)
          </h2>
          <p className="text-[11px] text-slate-500">
            Quick production & manpower summary.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1.5">
            {error}
          </div>
        )}
        {success && (
          <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-2 py-1.5">
            {success}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field
            label="Operator TO"
            name="operatorTo"
            value={form.operatorTo}
            onChange={handleChange}
            placeholder="32"
          />
          <Field
            label="Manpower Present"
            name="manpowerPresent"
            value={form.manpowerPresent}
            onChange={handleChange}
            placeholder="30"
          />
          <Field
            label="Manpower Absent"
            name="manpowerAbsent"
            value={form.manpowerAbsent}
            onChange={handleChange}
            placeholder="2"
          />
          <Field
            label="Working Hour"
            name="workingHour"
            value={form.workingHour}
            onChange={handleChange}
            placeholder="8"
          />
          <Field
            label="Plan Quantity"
            name="planQuantity"
            value={form.planQuantity}
            onChange={handleChange}
            placeholder="2000"
          />
          <Field
            label="Plan Efficiency (%)"
            name="planEfficiency"
            value={form.planEfficiency}
            onChange={handleChange}
            placeholder="90"
          />
          <Field
            label="SMV"
            name="smv"
            value={form.smv}
            onChange={handleChange}
            placeholder="1.2"
          />
          <Field
            label="Today Target"
            name="todayTarget"
            value={form.todayTarget}
            onChange={handleChange}
            placeholder="1000"
          />
          <Field
            label="Achieve (optional)"
            name="achieve"
            value={form.achieve}
            onChange={handleChange}
            placeholder="700"
          />
        </div>

        {/* Footer buttons */}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={resetForm}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            disabled={busy}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60"
            disabled={busy || !isExisting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-70"
            disabled={busy}
          >
            {saving
              ? isExisting
                ? "Updating..."
                : "Saving..."
              : isExisting
              ? "Update Header"
              : "Save Header"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 🔹 Compact reusable field
function Field({ label, name, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={name}
        className="text-[11px] font-medium uppercase tracking-wide text-slate-600"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="h-8 w-full rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-900
                   focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
        placeholder={placeholder}
      />
    </div>
  );
}
