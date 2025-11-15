// app/components/ProductionLoginForm.jsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PerformProductionLogin } from "@/app/actions";
import { useProductionAuth } from "@/app/hooks/useProductionAuth";

export default function ProductionLoginForm() {
  const router = useRouter();
  const { setProductionAuth } = useProductionAuth();
  const [error, setError] = useState("");

  // 🔹 Handle login submit
  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const formData = new FormData(event.currentTarget);
      const found = await PerformProductionLogin(formData);

      if (found) {
        // ✅ Save user in context so ProductionSignInOut can read it
        setProductionAuth(found);

        // Redirect after setting auth
        router.push("/ProductionHomePage");
      } else {
        setError("Please provide valid login credentials");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      {error && (
        <div className="my-2 text-sm text-red-600 text-center font-medium">
          {error}
        </div>
      )}

      <form className="space-y-5" onSubmit={onSubmit}>
        {/* Username Field */}
        <div>
          <label
            htmlFor="Production_user_name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Production User Name
          </label>
          <input
            type="text"
            id="Production_user_name"
            name="Production_user_name"
            className="w-full border text-black border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none rounded-lg px-3 py-2"
            placeholder="Enter your username"
            required
          />
        </div>

        {/* Password Field */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="w-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 text-black focus:outline-none rounded-lg px-3 py-2"
            placeholder="••••••••"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg py-2 transition-all duration-200"
        >
          Login
        </button>
      </form>
    </>
  );
}
