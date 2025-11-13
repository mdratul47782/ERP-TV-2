"use client";

import { useAuth } from "../hooks/useAuth";
import { useMemo } from "react";

// Outer card tones (KpiTile-style)
const toneCardMap = {
  emerald:
    "from-emerald-500/15 to-emerald-500/5 border-emerald-400/30 ring-emerald-400/40 text-emerald-100",
  sky:
    "from-sky-500/15 to-sky-500/5 border-sky-400/30 ring-sky-400/40 text-sky-100",
  red:
    "from-red-500/15 to-red-500/5 border-red-400/30 ring-red-400/40 text-red-100",
  amber:
    "from-amber-500/15 to-amber-500/5 border-amber-400/30 ring-amber-400/40 text-amber-100",
};

// Chip tones (no text color here, text handled separately)
const chipToneMap = {
  sky: "from-sky-500/20 to-sky-500/5 border-sky-400/40 ring-sky-400/40",
  emerald:
    "from-emerald-500/20 to-emerald-500/5 border-emerald-400/40 ring-emerald-400/40",
  violet:
    "from-violet-500/20 to-violet-500/5 border-violet-400/40 ring-violet-400/40",
  amber:
    "from-amber-500/20 to-amber-500/5 border-amber-400/40 ring-amber-400/40",
  rose:
    "from-rose-500/20 to-rose-500/5 border-rose-400/40 ring-rose-400/40",
  cyan: "from-cyan-500/20 to-cyan-500/5 border-cyan-400/40 ring-cyan-400/40",
  fuchsia:
    "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-400/40 ring-fuchsia-400/40",
  default:
    "from-slate-500/20 to-slate-900/60 border-slate-400/40 ring-slate-400/40",
};

export default function InspectionTopInput({
  className = "",
  id,
  registerData = [],
  theme = "dark", // "dark" (glassy gradient) | "light" (white card)
  tone = "sky", // default outer card = sky (blue)
}) {
  const { auth } = useAuth();

  const userRegister = useMemo(() => {
    const name = auth?.user_name?.trim()?.toLowerCase();
    if (!name) return null;
    return registerData.find(
      (r) => r?.created_by?.trim()?.toLowerCase() === name
    );
  }, [auth, registerData]);

  const fields = [
    { label: "Building", value: userRegister?.building, tone: "sky" },
    { label: "Floor", value: userRegister?.floor, tone: "emerald" },
    { label: "Line", value: userRegister?.line, tone: "violet" },
    { label: "Buyer", value: userRegister?.buyer, tone: "amber" },
    { label: "Style", value: userRegister?.style, tone: "rose" },
    { label: "Style/Item", value: userRegister?.item, tone: "cyan" },
    { label: "Color/Model", value: userRegister?.color, tone: "fuchsia" },
  ];

  const isLight = theme === "light";
  const toneClasses = toneCardMap[tone] || toneCardMap.sky;

  return (
    <header id={id} className={`w-full z-20 ${className}`}>
      <div className="mx-auto max-w-screen-3xl">
        {/* Container switches by theme */}
        <div
          className={
            isLight
              ? // LIGHT: white card
                "relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-3 shadow-sm"
              : // DARK: gradient KpiTile-style card
                `group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-3 ring-1 transition-transform duration-200 hover:translate-y-0.5 ${toneClasses}`
          }
        >
          {/* subtle corner glow (same as KpiTile) */}
          {!isLight && (
            <div className="pointer-events-none absolute -inset-px rounded-[1.1rem] bg-[radial-gradient(120px_60px_at_0%_0%,rgba(255,255,255,0.12),transparent)] " />
          )}

          <div className="relative ">
            {/* Chips */}
            <div className="py-0">
              <ul
                className="
                  flex items-stretch px-1
                  gap-1 sm:gap-1 lg:gap-3
                  justify-between
                  w-full
                  overflow-hidden py-0
                "
              >
                {fields.map((f) => {
                  const chipToneClass =
                    chipToneMap[f.tone] || chipToneMap.default;

                  return (
                    <li
                      key={f.label}
                      className={
                        isLight
                          ? // LIGHT chip: simple white
                            "relative flex-1 min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm text-center"
                          : // DARK chip: colorful gradient
                            `relative flex-1 min-w-0 overflow-hidden rounded-lg border bg-gradient-to-br px-2 py-1 sm:px-3 sm:py-1.5 shadow-sm text-center ring-1 ${chipToneClass}`
                      }
                      title={f.value || ""}
                    >
                      {/* subtle glow inside each chip (dark only) */}
                      {!isLight && (
                        <div className="pointer-events-none absolute -inset-px rounded-[0.9rem] bg-[radial-gradient(80px_40px_at_0%_0%,rgba(255,255,255,0.14),transparent)]" />
                      )}

                      <div className="relative flex items-center gap-1 sm:gap-2 min-w-0">
                        <span
                          className={
                            isLight
                              ? "text-[10px] sm:text-[11px] lg:text-xs text-slate-600 font-semibold tracking-wider whitespace-nowrap"
                              : "text-[10px] sm:text-[11px] lg:text-xs text-white/80 font-semibold tracking-wider whitespace-nowrap"
                          }
                        >
                          {f.label}:
                        </span>
                        <span
                          className={
                            isLight
                              ? "flex-1 min-w-0 text-xs sm:text-sm lg:text-base font-semibold text-slate-900 truncate"
                              : "flex-1 min-w-0 text-xs sm:text-sm lg:text-base font-semibold text-white truncate"
                          }
                        >
                          {f.value || "—"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {!auth && (
          <p
            className={
              isLight
                ? "mt-1 text-center text-[12px] sm:text-sm text-red-600"
                : "mt-1 text-center text-[12px] sm:text-sm text-red-300"
            }
          >
            Please log in to view your line information.
          </p>
        )}
        {auth && !userRegister && (
          <p
            className={
              isLight
                ? "mt-1 text-center text-[12px] sm:text-sm text-yellow-700"
                : "mt-1 text-center text-[12px] sm:text-sm text-yellow-200"
            }
          >
            No registered line info found for{" "}
            <b className={isLight ? "text-slate-900" : "text-white/90"}>
              {auth?.user_name}
            </b>
            .
          </p>
        )}
      </div>
    </header>
  );
}
