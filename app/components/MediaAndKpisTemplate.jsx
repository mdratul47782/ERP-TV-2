// app/components/MediaAndKpisTemplate.jsx
"use client";
import React from "react";

const Placeholder = ({ title }) => (
  <div className="flex h-full w-full flex-col items-center justify-center text-xs text-gray-300">
    <div className="mb-2 text-sm font-semibold">No {title.toLowerCase()}</div>
    <div className="opacity-70">Pass a {title.toLowerCase()}Src prop</div>
  </div>
);

function KpiTile({ label, value, tone = "neutral" }) {
  const toneClasses = {
    neutral: "bg-gray-900 border-gray-700 text-white",
    blue: "bg-sky-600 text-white border-sky-400",
    red: "bg-red-600 text-white border-red-400",
    green: "bg-lime-500 text-gray-900 border-lime-300",
    light: "bg-white text-gray-900 border-gray-200",
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${toneClasses[tone]}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{label}</div>
      <div className="text-2xl font-extrabold leading-none">{value}</div>
    </div>
  );
}

function MediaTile({ title, children }) {
  return (
    <div className="relative rounded-lg border border-emerald-600 bg-black/60 p-2">
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md flex items-center justify-center">
        {children}
      </div>
      <div className="absolute -top-2 left-2 rounded-sm bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-900">
        {title}
      </div>
    </div>
  );
}

export default function MediaAndKpisTemplate({
  imageSrc,
  videoSrc,
  defects,
  passingRatePct = 100,
  rejectPct = 0,
  overallDHUPct = 100,
  className,
}) {
  const list = (defects && defects.length ? defects : ["—", "—", "—"]).slice(0, 3);

  return (
    <div className={`w-full max-w-5xl mx-auto grid grid-cols-1 gap-3 p-3 text-white md:grid-cols-3 ${className || ""}`}>
      <div className="md:col-span-2 rounded-xl border border-emerald-500 p-2 bg-black">
        <div className="grid grid-cols-2 gap-2">
          <MediaTile title="Image">
            {imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageSrc} alt="Image" className="h-full w-full object-contain" />
            ) : (
              <Placeholder title="Image" />
            )}
          </MediaTile>
          <MediaTile title="Video">
            {videoSrc ? (
              <video className="h-full w-full" controls>
                <source src={videoSrc} />
                Your browser does not support the video tag.
              </video>
            ) : (
              <Placeholder title="Video" />
            )}
          </MediaTile>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-red-400 bg-red-600 p-3 text-white">
          <div className="text-xs font-bold uppercase tracking-wide">Top 3 Defects</div>
          <ol className="mt-2 space-y-1 text-sm font-semibold">
            {list.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-white/20 text-[11px] font-bold">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{d}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiTile label="Passing Rate" value={`${passingRatePct}%`} tone="blue" />
          <KpiTile label="Reject" value={`${rejectPct}%`} tone="red" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <KpiTile label="Overall DHU%" value={`${overallDHUPct}%`} tone="green" />
          <KpiTile label="Hourly Inspection Report" value="Open" tone="light" />
        </div>
      </div>
    </div>
  );
}
