// app/providers/ProductionAuthProvider.jsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { ProductionAuthContext } from "../contexts";

const STORAGE_KEY = "productionAuthUser"; // 🔹 Separate key from normal auth

export default function ProductionAuthProvider({ children }) {
  // 🔹 Initial read from localStorage (before first paint)
  const [ProductionAuth, setProductionAuth] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // 🔹 Hydration gate — no UI until client is ready (prevents blink)
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  // 🔹 Sync to localStorage whenever ProductionAuth changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (ProductionAuth) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ProductionAuth));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to write production auth to localStorage", e);
    }
  }, [ProductionAuth]);

  // 🔹 Multi-tab / multi-window sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        try {
          setProductionAuth(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setProductionAuth(null);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 🔹 Helpers for login/logout
  const login = useCallback((user) => setProductionAuth(user), []);
  const logout = useCallback(() => setProductionAuth(null), []);

  const value = useMemo(
    () => ({
      ProductionAuth,
      setProductionAuth,
      login,
      logout,
      loading: !ready,
    }),
    [ProductionAuth, login, logout, ready]
  );

  // 🔹 Don’t render children until hydration is done
  if (!ready) return null;

  return (
    <ProductionAuthContext.Provider value={value}>
      {children}
    </ProductionAuthContext.Provider>
  );
}
