// app/components/ProductionInputForm.jsx
"use client";

import ProductionSignInOut from "../components/auth/ProductionSignInOut";
import { useEffect, useState } from "react";
import { useProductionAuth } from "../hooks/useProductionAuth";
import { useAuth } from "../hooks/useAuth";

export default function ProductionInputForm() {
  const { ProductionAuth, loading: productionLoading } = useProductionAuth();
  const { auth, loading: authLoading } = useAuth();

  // 🔹 Main form state (added smv)
  const [form, setForm] = useState({
    operatorTo: "",
    manpowerPresent: "",
    manpowerAbsent: "",
    workingHour: "",
    planQuantity: "",
    planEfficiency: "",
    todayTarget: "",
    achieve: "",
    smv: "", // ✅ NEW
  });

  const [loadingExisting, setLoadingExisting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // ✅ NEW
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [headerId, setHeaderId] = useState(null); // ✅ track existing header

  // 🔹 Helper: map header doc → form state
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
      smv: header.smv?.toString() ?? "", // ✅ NEW
    });
  };

  // 🔹 Reset form helper
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
      smv: "", // ✅ NEW
    });

  // 🔹 Load today's header once ProductionAuth is ready
  useEffect(() => {
    if (productionLoading) return;
    if (!ProductionAuth?.id) return;

    const fetchToday = async () => {
      try {
        setLoadingExisting(true);
        setError("");
        setSuccess("");

        const res = await fetch(
          `/api/production-headers?productionUserId=${ProductionAuth.id}`
        );
        const json = await res.json();

        if (res.ok && json.success && json.data) {
          fillFormFromHeader(json.data);
          setHeaderId(json.data._id); // ✅ remember document id
        } else {
          setHeaderId(null);
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

  // 🔹 Build snapshots from contexts (no password)
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

  // 🔹 Save / Update (POST for new, PATCH for existing)
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
      const payload = {
        ...form,
        productionUser: buildProductionUserSnapshot(),
        qualityUser: buildQualityUserSnapshot(),
        // optional: productionDate: "2025-11-15"
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
    <>
      <ProductionSignInOut />
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white/80 shadow-sm p-4 md:p-6 space-y-4"
      >
        {/* Title */}
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900">
            Production Header (Today)
          </h2>
          <p className="text-xs text-slate-500">
            Fill today&apos;s production planning and manpower details.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
            {success}
          </div>
        )}

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field
            label="Operator TO"
            name="operatorTo"
            value={form.operatorTo}
            onChange={handleChange}
            placeholder="e.g. 32"
          />
          <Field
            label="Manpower Present"
            name="manpowerPresent"
            value={form.manpowerPresent}
            onChange={handleChange}
            placeholder="e.g. 30"
          />
          <Field
            label="Manpower Absent"
            name="manpowerAbsent"
            value={form.manpowerAbsent}
            onChange={handleChange}
            placeholder="e.g. 2"
          />
          <Field
            label="Working Hour"
            name="workingHour"
            value={form.workingHour}
            onChange={handleChange}
            placeholder="e.g. 8"
          />
          <Field
            label="Plan Quantity"
            name="planQuantity"
            value={form.planQuantity}
            onChange={handleChange}
            placeholder="e.g. 1200"
          />
          <Field
            label="Plan Efficiency (%)"
            name="planEfficiency"
            value={form.planEfficiency}
            onChange={handleChange}
            placeholder="e.g. 85"
          />
          {/* ✅ NEW SMV FIELD */}
          <Field
            label="SMV"
            name="smv"
            value={form.smv}
            onChange={handleChange}
            placeholder="e.g. 1.2"
          />
          <Field
            label="Today Target"
            name="todayTarget"
            value={form.todayTarget}
            onChange={handleChange}
            placeholder="e.g. 1100"
          />
          <Field
            label="Achieve (optional)"
            name="achieve"
            value={form.achieve}
            onChange={handleChange}
            placeholder="Leave blank to fill later"
          />
        </div>

        {/* Footer */}
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={resetForm}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
            disabled={busy}
          >
            Clear
          </button>

          {/* Delete only when record exists */}
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 rounded-lg text-sm font-semibold border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-60"
            disabled={busy || !isExisting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>

          <button
            type="submit"
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-70"
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
    </>
  );
}

// 🔹 Reusable field
function Field({ label, name, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={name}
        className="text-xs font-medium uppercase tracking-wide text-slate-600"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-inner
                   focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        placeholder={placeholder}
      />
    </div>
  );
}
