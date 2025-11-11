"use client";
import React, { useMemo, useState } from "react";

/* -------------------------------- UI bits -------------------------------- */
const Placeholder = ({ title }) => (
  <div className="flex h-full w-full flex-col items-center justify-center text-xs text-gray-300 text-center px-2">
    <div className="mb-2 text-sm font-semibold">No {title.toLowerCase()}</div>
    <div className="opacity-70">Add {title.toLowerCase()} in Media Links Editor</div>
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
      <div className="aspect-[4/5] w-full overflow-hidden rounded-md flex items-center justify-center bg-gray-900">
        {children}
      </div>
      <div className="absolute -top-2 left-2 rounded-sm bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-900">
        {title}
      </div>
    </div>
  );
}

/* ---------------- Google Drive helpers ---------------- */
function extractGoogleDriveId(url) {
  if (!url) return null;
  try {
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];

    // Format 2: https://drive.google.com/open?id=FILE_ID
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];

    // Format 3: Already in uc format
    const match3 = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (match3) return match3[1];

    return null;
  } catch {
    return null;
  }
}

function isGoogleDriveUrl(url) {
  if (!url) return false;
  return url.includes("drive.google.com");
}

function convertToDirectImageUrl(url) {
  if (!url) return "";

  if (isGoogleDriveUrl(url)) {
    const fileId = extractGoogleDriveId(url);
    if (fileId) {
      // Use uc?export=download for actual image file
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
  }

  return url;
}

// UPDATED: return multiple candidate URLs for video so we can retry and ensure autoplay/loop
function convertToDirectVideoUrl(url) {
  if (!url) return { isDrive: false, candidates: [] };

  if (isGoogleDriveUrl(url)) {
    const fileId = extractGoogleDriveId(url);
    if (fileId) {
      const candidates = [
        // Try several flavors; tenant/CDN policies vary
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/uc?export=preview&id=${fileId}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`,
      ];
      return {
        isDrive: true,
        candidates,
        // Keep preview iframe as a last-ditch fallback
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }

  return { isDrive: false, candidates: [url] };
}

/* ---------------- Small resilient video player ---------------- */
function VideoPlayer({ sources, iframeFallback }) {
  const [idx, setIdx] = useState(0);
  const [useIframe, setUseIframe] = useState(false);

  if (useIframe && iframeFallback) {
    return (
      <iframe
        src={iframeFallback}
        className="h-full w-full rounded-md"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Video Player"
      />
    );
  }

  const src = sources[idx];

  return (
    <video
      key={src} // force reload when switching sources
      className="h-full w-full rounded-md"
      autoPlay
      loop
      muted
      playsInline
      controls
      onEnded={(e) => {
        const v = e.currentTarget;
        try {
          v.currentTime = 0;
          v.play();
        } catch {}
      }}
      onLoadedMetadata={(e) => {
        try {
          e.currentTarget.play();
        } catch {}
      }}
      onError={() => {
        if (idx < sources.length - 1) {
          setIdx(idx + 1);
        } else if (iframeFallback) {
          setUseIframe(true);
        }
      }}
    >
      <source src={src} />
      Your browser does not support the video tag.
    </video>
  );
}

/* ---------------- PIE CHART (pure SVG, no libs) ---------------- */
function DefectsPie({
  defects,               // strings OR {name/label, value/count}
  size = 160,
  thickness = 22,
}) {
  const norm = (Array.isArray(defects) ? defects : []).slice(0, 3).map((d, i) => {
    if (typeof d === "string") return { label: d, value: 1 };
    const label = d?.label ?? d?.name ?? `Defect ${i + 1}`;
    const value = Number(d?.value ?? d?.count ?? 1) || 1;
    return { label, value };
  });

  const total = norm.reduce((a, b) => a + b.value, 0) || 1; // avoid /0
  const COLORS = ["#F87171", "#FB923C", "#F59E0B"]; // red → orange → amber

  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  let acc = 0;

  return (
    <div className="flex flex-col items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
          <circle r={r} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={thickness} />
          {norm.map((s, i) => {
            const frac = s.value / total;
            const dasharray = `${c * frac} ${c}`;
            const dashoffset = c * (1 - acc);
            acc += frac;
            return (
              <circle
                key={i}
                r={r}
                fill="none"
                stroke={COLORS[i % COLORS.length]}
                strokeWidth={thickness}
                strokeLinecap="butt"
                strokeDasharray={dasharray}
                strokeDashoffset={dashoffset}
              />
            );
          })}
        </g>
      </svg>

      <div className="mt-2 w-full grid grid-cols-3 gap-2 text-[11px]">
        {norm.map((s, i) => {
          const pct = Math.round((s.value / total) * 100);
          return (
            <div key={i} className="flex items-center gap-2 min-w-0">
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{s.label}</span>
              <span className="ml-auto text-white/70">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Main component ---------------- */
export default function MediaAndKpisTemplate({
  imageSrc,
  videoSrc,
  defects,
  passingRatePct = 100,
  rejectPct = 0,
  overallDHUPct = 100,
  className,
}) {
  const [imgError, setImgError] = useState(false);
  const [imgAttempt, setImgAttempt] = useState(0);

  // Convert image URL with fallback attempts
  const finalImageSrc = useMemo(() => {
    if (!imageSrc) return "";

    if (isGoogleDriveUrl(imageSrc)) {
      const fileId = extractGoogleDriveId(imageSrc);
      if (!fileId) return "";

      if (imgAttempt === 0) {
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      } else if (imgAttempt === 1) {
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      } else if (imgAttempt === 2) {
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
      }
    }

    return imageSrc;
  }, [imageSrc, imgAttempt]);

  // Convert video URL (now provides multiple candidates + iframe fallback)
  const videoData = useMemo(() => {
    return convertToDirectVideoUrl(videoSrc);
  }, [videoSrc]);

  const list = (defects && defects.length ? defects : ["—", "—", "—"]).slice(0, 3);

  return (
    <div className={`w-full max-w-7xl bg-black mx-auto grid grid-cols-1 gap-3 p-3 text-white md:grid-cols-3 ${className || ""}`}>
      {/* LEFT: Media */}
      <div className="md:col-span-2 rounded-1xl border  p-0 bg-black">
        <div className="grid grid-cols-2 gap-2">
          {/* IMAGE */}
          <MediaTile title="Image">
            {finalImageSrc && !imgError ? (
              <img
                src={finalImageSrc}
                alt="Quality Image"
                className="h-full w-full object-contain"
                onError={() => {
                  console.error("Image failed to load (attempt " + imgAttempt + "):", finalImageSrc);
                  if (imgAttempt < 2) {
                    setImgAttempt(imgAttempt + 1);
                    setImgError(false);
                  } else {
                    setImgError(true);
                  }
                }}
                onLoad={() => {
                  console.log("Image loaded successfully:", finalImageSrc);
                }}
              />
            ) : finalImageSrc && imgError ? (
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-amber-400 text-xs mb-2">⚠️ Image Load Failed</div>
                <div className="text-[10px] text-gray-400 mb-2">Checklist:</div>
                <ul className="text-[10px] text-gray-400 text-left space-y-1">
                  <li>✓ File shared as "Anyone with the link"</li>
                  <li>✓ Permission set to "Viewer"</li>
                  <li>✓ File ID is correct</li>
                </ul>
                <div className="mt-2 text-[9px] text-gray-500 font-mono break-all">
                  ID: {extractGoogleDriveId(imageSrc)}
                </div>
                <a
                  href={imageSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-400 underline mt-2"
                >
                  Check File in Drive →
                </a>
              </div>
            ) : (
              <Placeholder title="Image" />
            )}
          </MediaTile>

          {/* VIDEO */}
          <MediaTile title="Video">
            {videoData?.candidates?.length ? (
              <VideoPlayer
                sources={videoData.candidates}
                iframeFallback={videoData.embedUrl}
              />
            ) : (
              <Placeholder title="Video" />
            )}
          </MediaTile>
        </div>
      </div>

      {/* RIGHT: KPIs */}
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-red-400 bg-red-600 p-3 text-white">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold uppercase tracking-wide">Top 3 Defects</div>
            <div className="text-[10px] opacity-80">{new Date().toLocaleTimeString()}</div>
          </div>

          {/* List + Pie side by side on md+; stacked on mobile */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ol className="space-y-1 text-sm font-semibold">
              {list.map((d, i) => {
                const label = typeof d === "string" ? d : d?.label ?? d?.name ?? `Defect ${i + 1}`;
                const count =
                  typeof d === "object" && (d?.value != null || d?.count != null)
                    ? (d.value ?? d.count)
                    : null;
                return (
                  <li key={i} className="flex items-center gap-2 rounded-md bg-white/10 px-2 py-1">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-white/20 text-[11px] font-bold">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate">{label}</span>
                    {count != null ? (
                      <span className="ml-auto text-white/80 text-xs">{count}</span>
                    ) : null}
                  </li>
                );
              })}
            </ol>

            <div className="flex items-center justify-center">
              <DefectsPie defects={list} size={180} thickness={26} />
            </div>
          </div>
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
