"use client";
import React from "react";
import { useAuth } from "../hooks/useAuth";
export default function InputRow() {
  const { auth } = useAuth();
  return (
    <div className="w-full overflow-x-auto">
      <table className="border border-gray-400 w-4x1 text-center">
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
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5 focus:outline-none"
              />
            </td>
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5"
              />
            </td>
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5"
              />
            </td>
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5"
              />
            </td>
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5"
              />
            </td>
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5"
              />
            </td>
            <td className="border border-gray-400 p-1">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-1 py-0.5"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
