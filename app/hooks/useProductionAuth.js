// app/hooks/useProductionAuth.js
"use client";

import { useContext } from "react";
import { ProductionAuthContext } from "../contexts";

// 🔹 Custom hook to read/update production auth
export const useProductionAuth = () => {
  const ctx = useContext(ProductionAuthContext);

  if (!ctx) {
    throw new Error("useProductionAuth must be used inside ProductionAuthProvider");
  }

  const { ProductionAuth, setProductionAuth } = ctx;
  return { ProductionAuth, setProductionAuth };
};
