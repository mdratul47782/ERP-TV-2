"use client";
import { useMemo, useState, useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  PlayCircle,
  TrendingUp,
  Gauge,
  CheckCircle2,
  TriangleAlert,
  ExternalLink,
} from "lucide-react";

/* -------------------------- Shared helpers & UI -------------------------- */
const Placeholder = ({ title }) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
    <div className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-wider text-white/80">
      No {title.toLowerCase()}
    </div>
    <div className="text-xs text-white/60">
      Add {title.toLowerCase()} in Media Links Editor
    </div>
  </div>
);

function KpiTile({ label, value, tone = "emerald", icon: Icon }) {
  const toneMap = {
    emerald: {
      card: "from-emerald-500/15 to-emerald-500/5 border-emerald-400/30 ring-emerald-400/40 text-emerald-100",
      badge: "bg-emerald-500/90 text-emerald-950",
    },
    sky: {
      card: "from-sky-500/15 to-sky-500/5 border-sky-400/30 ring-sky-400/40 text-sky-100",
      badge: "bg-sky-400/90 text-sky-950",
    },
    red: {
      card: "from-red-500/15 to-red-500/5 border-red-400/30 ring-red-400/40 text-red-100",
      badge: "bg-red-500/90 text-red-50",
    },
    amber: {
      card: "from-amber-500/15 to-amber-500/5 border-amber-400/30 ring-amber-400/40 text-amber-100",
      badge: "bg-amber-400/90 text-amber-950",
    },
  }[tone];

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border ${toneMap.card} bg-gradient-to-br p-2.5 sm:p-3 ring-1 transition-transform duration-200 hover:translate-y-0.5 min-h-[84px]`}
    >
      {/* subtle corner glow */}
      <div className="pointer-events-none absolute -inset-px rounded-[1.1rem] bg-[radial-gradient(120px_60px_at_0%_0%,rgba(255,255,255,0.12),transparent)]" />

      <div className="relative flex items-center justify-between">
        <div
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${toneMap.badge}`}
        >
          {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
          {label}
        </div>
        <span className="text-[10px] sm:text-xs text-white/70">KPI</span>
      </div>

      <div className="mt-2 text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight text-white">
        {value}
      </div>
    </div>
  );
}

function MediaTile({ title, icon: Icon, children }) {
  return (
    <div className="group relative h-full rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md transition-colors">
      <div className="absolute -top-2 left-2 inline-flex items-center gap-1 rounded-md bg-emerald-400/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-950">
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {title}
      </div>
      <div className="relative grid h-full place-items-center overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-900/70 to-slate-900/30 min-h-[180px] sm:min-h-[220px] md:min-h-[260px] lg:min-h-[300px]">
        {children}
      </div>
    </div>
  );
}

/* ---------------- Google Drive helpers ---------------- */
function extractGoogleDriveId(url) {
  if (!url) return null;
  try {
    const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match1) return match1[1];
    const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match2) return match2[1];
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
    if (fileId)
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return url;
}

// return multiple candidate URLs for video so we can retry and ensure autoplay/loop
function convertToDirectVideoUrl(url) {
  if (!url) return { isDrive: false, candidates: [] };
  if (isGoogleDriveUrl(url)) {
    const fileId = extractGoogleDriveId(url);
    if (fileId) {
      const candidates = [
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/uc?export=preview&id=${fileId}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`,
      ];
      return {
        isDrive: true,
        candidates,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      };
    }
  }
  return { isDrive: false, candidates: [url] };
}

/* ---------------- Percent + defect helpers ---------------- */
function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

// precise percent formatter (keeps two decimals)
function safePctString(n, digits = 2) {
  if (n == null || n === "") return `${(0).toFixed(digits)}%`;
  let raw = typeof n === "string" ? n.trim() : n;
  if (typeof raw === "string" && raw.endsWith("%")) {
    raw = raw.slice(0, -1);
  }
  let x = Number(raw);
  if (!Number.isFinite(x)) return `${(0).toFixed(digits)}%`;
  if (x > 0 && x <= 1 && (typeof n !== "string" || !String(n).includes("%"))) {
    x *= 100;
  }
  x = Math.min(100, Math.max(0, x));
  return `${x.toFixed(digits)}%`;
}

// parse any defect entry
function parseDefect(d, i) {
  if (typeof d === "string") {
    const m = d.match(/^(.*?)(?:\s*\((\d+)\))?$/);
    const label = (m && m[1] ? m[1] : d).trim() || `Defect ${i + 1}`;
    let value = m && m[2] ? Number(m[2]) : 0;
    if (!Number.isFinite(value) || value < 0) value = 0;
    return { label, value };
  }
  const label =
    d && (d.label || d.name)
      ? (d.label || d.name).toString()
      : `Defect ${i + 1}`;
  let value = Number(
    d && (d.value != null ? d.value : d.count != null ? d.count : 0)
  );
  if (!Number.isFinite(value) || value < 0) value = 0;
  return { label, value };
}

// Sum across ALL provided defects (not just top N)
function sumAllDefects(raw) {
  if (!Array.isArray(raw)) return 0;
  return raw.reduce((acc, d, i) => acc + parseDefect(d, i).value, 0);
}

/* ---------------- Defects normalization (true Top N) ---------------- */
function normalizeDefects(raw, limit = 3) {
  if (!Array.isArray(raw)) return [];
  const parsed = raw.map((d, i) => parseDefect(d, i));
  parsed.sort((a, b) => b.value - a.value);
  return parsed.slice(0, Math.max(0, limit));
}

/* ---------------- PIE CHART (pure SVG, with center total) ---------------- */
function DefectsPie({ defects, size = 150, thickness = 16 }) {
  const norm = normalizeDefects(defects, 3);
  const total = norm.reduce((a, b) => a + b.value, 0);

  const COLORS = ["#fb7185", "#f59e0b", "#38bdf8"]; // rose, amber, sky
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;

  const EPS = 0.5; // seam trim to avoid overlaps
  let acc = 0;

  return (
    <div className="relative grid place-items-center sm:scale-100 scale-95">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${size / 2} ${size / 2}) rotate(-90)`}>
          {/* base ring */}
          <circle
            r={r}
            fill="none"
            stroke="rgba(255,255,255,.15)"
            strokeWidth={thickness}
          />

          {/* slices */}
          {total > 0 &&
            norm.map((s, i) => {
              const frac = s.value / total;
              const dash = Math.max(0, c * frac - EPS); // one dash per slice
              const gap = Math.max(0, c - dash);
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
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={dashoffset}
                />
              );
            })}
        </g>
      </svg>

      {/* center total */}
      <div className="pointer-events-none absolute grid place-items-center text-center">
        <div className="text-[10px] uppercase tracking-wider text-white/60">
          Total
        </div>
        <div className="text-2xl font-extrabold tabular-nums text-white">
          {total}
        </div>
      </div>

      {/* legend */}
      <div className="mt-3 w-full grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        {(norm.length
          ? norm
          : [
              { label: "—", value: 0 },
              { label: "—", value: 0 },
              { label: "—", value: 0 },
            ]
        ).map((s, i) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <div
              key={i}
              className="flex items-center gap-2 min-w-0 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1"
            >
              <span
                className="h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="truncate text-white/90">{s.label}</span>
              <span className="ml-auto text-white/70">{pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Small resilient video player ---------------- */
function VideoPlayer({ sources, iframeFallback }) {
  const [idx, setIdx] = useState(0);
  const [useIframe, setUseIframe] = useState(false);

  if (useIframe && iframeFallback) {
    return (
      <iframe
        src={iframeFallback}
        className="h-full w-full rounded-xl border border-white/10"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="Video Player"
      />
    );
  }

  const src = sources[idx];

  return (
    <video
      key={src}
      className="h-full w-full rounded-xl border border-white/10"
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
        if (idx < sources.length - 1) setIdx(idx + 1);
        else if (iframeFallback) setUseIframe(true);
      }}
    >
      <source src={src} />
      Your browser does not support the video tag.
    </video>
  );
}

/* ------------ helpers for image overlay circle drawing (no style changes) ----------- */
function containRect(containerW, containerH, naturalW, naturalH) {
  if (!containerW || !containerH || !naturalW || !naturalH) {
    return { x: 0, y: 0, width: containerW || 0, height: containerH || 0 };
  }
  const scale = Math.min(containerW / naturalW, containerH / naturalH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  const x = (containerW - width) / 2;
  const y = (containerH - height) / 2;
  return { x, y, width, height };
}

/* ---------------- Main component ---------------- */
export default function MediaAndKpisTemplate({
  imageSrc,
  videoSrc,
  defects,
  // prefer rftPct, keep passingRatePct for backwards compatibility
  rftPct,
  passingRatePct = 100,
  // LEGACY: rejectPct kept only as a fallback when counts are not provided
  rejectPct = 0,
  overallDHUPct = 100,
  // counts to compute the true Defect Rate
  inspectedUnits, // total units inspected/produced
  defectiveUnits, // number of defective units
  className,
}) {
  const [imgError, setImgError] = useState(false);
  const [imgAttempt, setImgAttempt] = useState(0);

  // NEW (JS only): refs + state for red-circle annotations
  const imgRef = useRef(null);
  const overlayRef = useRef(null);
  const imageWrapRef = useRef(null);
  const [overlaySize, setOverlaySize] = useState({ w: 0, h: 0 });
  const [circles, setCircles] = useState([]); // {cx, cy, r}
  const [drag, setDrag] = useState(null); // {startX, startY, cx, cy, r}

  const finalImageSrc = useMemo(() => {
    if (!imageSrc) return "";
    if (isGoogleDriveUrl(imageSrc)) {
      const fileId = extractGoogleDriveId(imageSrc);
      if (!fileId) return "";
      if (imgAttempt === 0)
        return `https://drive.google.com/uc?export=download&id=${fileId}`;
      if (imgAttempt === 1)
        return `https://drive.google.com/uc?export=view&id=${fileId}`;
      if (imgAttempt === 2)
        return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
    }
    return convertToDirectImageUrl(imageSrc);
  }, [imageSrc, imgAttempt]);

  // measure overlay size so SVG coords === CSS pixels
  useLayoutEffect(() => {
    const el = imageWrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      setOverlaySize({
        w: Math.max(1, Math.round(r.width)),
        h: Math.max(1, Math.round(r.height)),
      });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [finalImageSrc]);

  // clear circles when image changes
  useEffect(() => {
    setCircles([]);
    setDrag(null);
  }, [finalImageSrc]);

  const videoData = useMemo(
    () => convertToDirectVideoUrl(videoSrc),
    [videoSrc]
  );

  // Normalize once for list + pie (true Top 3)
  const normalizedDefects = useMemo(
    () => normalizeDefects(defects || [], 3),
    [defects]
  );
  const list =
    normalizedDefects.length > 0
      ? normalizedDefects
      : [
          { label: "—", value: 0 },
          { label: "—", value: 0 },
          { label: "—", value: 0 },
        ];

  // ---- Calculations ----
  const effectiveRftPct = useMemo(() => {
    const v = rftPct != null ? rftPct : passingRatePct;
    return Math.min(100, Math.max(0, Number(v)));
  }, [rftPct, passingRatePct]);

  const computedDefectRate = useMemo(() => {
    const total = Number(inspectedUnits);
    let defective = Number(defectiveUnits);
    if (!Number.isFinite(defective)) defective = sumAllDefects(defects);
    if (!Number.isFinite(total) || total <= 0) return null; // cannot compute without total
    const pct = (defective / total) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [inspectedUnits, defectiveUnits, defects]);

  const effectiveDefectRatePct =
    computedDefectRate == null ? Number(rejectPct) : computedDefectRate;

  // --- pointer handlers for drawing a dark red circle over the image area ---
  function getOverlayMetrics() {
    const svg = overlayRef.current;
    const img = imgRef.current;
    if (!svg || !img) return null;
    const rect = svg.getBoundingClientRect();
    const cw = rect.width;
    const ch = rect.height;
    const iw = img.naturalWidth || 0;
    const ih = img.naturalHeight || 0;
    const disp = containRect(cw, ch, iw, ih);
    return { rect, disp };
  }

  function clampToDisp(x, y, disp) {
    const cx = Math.min(disp.x + disp.width, Math.max(disp.x, x));
    const cy = Math.min(disp.y + disp.height, Math.max(disp.y, y));
    return { cx, cy };
  }

  function onPointerDown(e) {
    const m = getOverlayMetrics();
    if (!m) return;
    const { rect, disp } = m;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (
      x < disp.x ||
      x > disp.x + disp.width ||
      y < disp.y ||
      y > disp.y + disp.height
    )
      return;

    const { cx, cy } = clampToDisp(x, y, disp);
    const d = { startX: cx, startY: cy, cx, cy, r: 0 };
    setDrag(d);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  }

  function onPointerMove(e) {
    if (!drag) return;
    const m = getOverlayMetrics();
    if (!m) return;
    const { rect, disp } = m;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { cx, cy } = clampToDisp(drag.startX, drag.startY, disp);
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.hypot(dx, dy);
    const maxR = Math.min(
      cx - disp.x,
      disp.x + disp.width - cx,
      cy - disp.y,
      disp.y + disp.height - cy
    );
    const r = Math.max(2, Math.min(dist, maxR));
    setDrag({ ...drag, cx, cy, r });
  }

  function onPointerUp(e) {
    if (!drag) return;
    if (drag.r >= 2) {
      setCircles((prev) => [...prev, { cx: drag.cx, cy: drag.cy, r: drag.r }]);
    }
    setDrag(null);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  return (
    <div
      className={`relative mx-auto max-w-7xl p-2 sm:p-3 md:p-4 text-white ${
        className || ""
      }`}
    >
      {/* Ambient gradient background for the whole widget */}
      <div className="pointer-events-none absolute -inset-4 -z-10 bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(16,185,129,0.15),transparent),radial-gradient(900px_400px_at_100%_0%,rgba(56,189,248,0.15),transparent)]" />

      {/* Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
        {/* LEFT: Media */}
        <section className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
          {/* IMAGE */}
          <MediaTile title="Image" icon={ImageIcon}>
            {finalImageSrc && !imgError ? (
              <div ref={imageWrapRef} className="relative h-full w-full">
                <img
                  ref={imgRef}
                  src={finalImageSrc}
                  alt="Quality Image"
                  className="h-full w-full object-contain select-none"
                  onError={() => {
                    if (imgAttempt < 2) {
                      setImgAttempt(imgAttempt + 1);
                      setImgError(false);
                    } else {
                      setImgError(true);
                    }
                  }}
                  draggable={false}
                />
                {/* Transparent SVG overlay for dark red circles */}
                <svg
                  ref={overlayRef}
                  className="absolute inset-0"
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${overlaySize.w || 1} ${overlaySize.h || 1}`}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  style={{ touchAction: "none" }} // enable touch dragging
                >
                  {circles.map((c, i) => (
                    <circle
                      key={i}
                      cx={c.cx}
                      cy={c.cy}
                      r={c.r}
                      fill="none"
                      stroke="#7f1d1d" /* dark red */
                      strokeWidth="3"
                    />
                  ))}
                  {drag && drag.r > 0 ? (
                    <circle
                      cx={drag.cx}
                      cy={drag.cy}
                      r={drag.r}
                      fill="none"
                      stroke="#7f1d1d"
                      strokeWidth="3"
                      strokeDasharray="6 6"
                    />
                  ) : null}
                </svg>
                {/* Controls layer (above the SVG) */}
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute right-2 bottom-2 pointer-events-auto z-20 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCircles((prev) => prev.slice(0, -1))}
                      className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-900 hover:bg-white"
                    >
                      Undo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCircles([]);
                        setDrag(null);
                      }}
                      className="rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-900 hover:bg-white"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            ) : finalImageSrc && imgError ? (
              <div className="mx-auto max-w-xs rounded-lg border border-amber-400/40 bg-amber-500/10 p-3 text-center">
                <div className="mb-1 inline-flex items-center gap-1 text-amber-300">
                  <TriangleAlert className="h-4 w-4" />
                  <span className="text-xs font-semibold">
                    Image Load Failed
                  </span>
                </div>
                <ul className="mb-2 text-left text-[11px] text-amber-200/90">
                  <li>• Share as "Anyone with the link"</li>
                  <li>• Permission: Viewer</li>
                  <li>• Check File ID</li>
                </ul>
                <div className="font-mono text-[10px] text-white/60 break-all">
                  ID: {extractGoogleDriveId(imageSrc)}
                </div>
                <a
                  href={imageSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-[11px] text-sky-300 hover:underline"
                >
                  Check in Drive <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ) : (
              <Placeholder title="Image" />
            )}
          </MediaTile>

          {/* VIDEO */}
          <MediaTile title="Video" icon={PlayCircle}>
            {videoData &&
            videoData.candidates &&
            videoData.candidates.length ? (
              <VideoPlayer
                sources={videoData.candidates}
                iframeFallback={videoData.embedUrl}
              />
            ) : (
              <Placeholder title="Video" />
            )}
          </MediaTile>
        </section>

        {/* RIGHT: KPIs */}
        <aside className="flex min-h-0 flex-col gap-2.5 sm:gap-3">
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-[0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2">
                <Gauge className="h-4 w-4 text-emerald-300" />
                <h3 className="text-xs sm:text-sm uppercase tracking-wider text-white/90">
                  Top 3 Defects
                </h3>
              </div>
              <div className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-white/70">
                {new Date().toLocaleTimeString()}
              </div>
            </div>

            {/* List + Pie */}
            <div className="grid h-full grid-cols-1 gap-3 sm:grid-cols-2">
              <ol className="space-y-1 overflow-auto pr-1 text-[13px] sm:text-sm font-thin">
                {list.map((d, i) => {
                  const COLORS = ["#fb7185", "#f59e0b", "#38bdf8"]; // rose, amber, sky
                  const color = COLORS[i % COLORS.length];
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 py-1.5 sm:py-1 shadow-sm ring-1 ring-white/10 transition hover:bg-white/20"
                    >
                      <span
                        className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-[11px] font-extrabold"
                        style={{ backgroundColor: color, color: "black" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span className="truncate text-white">{d.label}</span>

                      <span
                        className="ml-auto tabular-nums text-xs"
                        style={{ color }}
                      >
                        {d.value}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="grid place-items-center">
                <DefectsPie defects={list} size={150} thickness={16} />
              </div>
            </div>
          </div>

          {/* compact KPI rows */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <KpiTile
              label="RFT%"
              value={safePctString(effectiveRftPct, 2)}
              tone="sky"
              icon={CheckCircle2}
            />
            <KpiTile
              label="Defect Rate"
              value={safePctString(effectiveDefectRatePct, 2)}
              tone="red"
              icon={TriangleAlert}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            <KpiTile
              label="Overall DHU%"
              value={safePctString(overallDHUPct, 2)}
              tone="emerald"
              icon={TrendingUp}
            />
            <Link href="/HourlyDashboard" className="block">
              <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-3 ring-1 ring-white/10 transition-transform duration-200 hover:translate-y-0.5 min-h-[84px]">
                <div className="mb-1 inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-900">
                  Open
                </div>
                <div className="text-sm font-bold text-white/90">
                  Hourly Inspection Report
                </div>
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
