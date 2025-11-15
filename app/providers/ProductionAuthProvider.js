// app/providers/ProductionAuthProvider.jsx
"use client";

import { useState } from "react";
import { ProductionAuthContext } from "../contexts";

// 🔹 Provides ProductionAuth and setProductionAuth to the tree
export default function ProductionAuthProvider({ children }) {
  const [ProductionAuth, setProductionAuth] = useState(null);

  return (
    <ProductionAuthContext.Provider value={{ ProductionAuth, setProductionAuth }}>
      {children}
    </ProductionAuthContext.Provider>
  );
}
