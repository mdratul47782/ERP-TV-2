"use client";
import React, { useEffect, useMemo, useState } from "react";

/* --------------------------------------------------------------------------
   PRODUCTION ROW TV DASHBOARD — ZERO-DEPENDENCY VERSION
   ⚡ No shadcn/ui, no recharts, no framer-motion, no icon libs.
   ✅ Pure React + Tailwind CSS only.
   - Resilient Google Drive video (autoplay/loop) with multi-URL retries + iframe fallback
   - Drive image loader with retries + helpful fallback
   - Large, TV-ready typography and high-contrast design
   - Radial pass gauge built with inline SVG
   - Simple Card/Badge/Progress components implemented here
   - Clock + wake-lock + optional auto-refresh cache-bust
-------------------------------------------------------------------------- */

/****************************** UTIL *********************************/
function clsx(...c) { return c.filter(Boolean).join(" "); }

/*************************** LIGHTWEIGHT UI ***************************/
const Card = ({ className = "", children }) => (
  <div className={clsx("rounded-2xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md shadow-lg shadow-emerald-500/5", className)}>
    {children}
  </div>
);
const CardHeader = ({ className = "", children }) => (
  <div className={clsx("px-4 pt-4 pb-2", className)}>{children}</div>
);
const CardContent = ({ className = "", children }) => (
  <div className={clsx("px-4 pb-4", className)}>{children}</div>
);
const CardTitle = ({ className = "", children }) => (
  <div className={clsx("uppercase tracking-wide text-zinc-300", className)}>{children}</div>
);
const Badge = ({ className = "", children }) => (
  <span className={clsx("inline-flex items-center rounded-full border px-3 py-1 text-[clamp(10px,1vw,14px)]", className)}>{children}</span>
);
const Progress = ({ value = 0, className = "" }) => (
  <div className={clsx("h-3 w-full rounded-full bg-zinc-800 overflow-hidden", className)}>
    <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);
const Separator = ({ className = "" }) => (
  <div className={clsx("h-px w-full bg-zinc-800", className)} />
);

/******************************* ICONS ********************************/
const Icon = {
  Play: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="12" cy="12" r="10" opacity=".3"/><path d="M10 8l6 4-6 4z"/></svg>
  ),
  Image: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
  ),
  Alert: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>
  ),
  Check: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M20 6L9 17l-5-5"/></svg>
  ),
  Down: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M7 10l5 5 5-5"/></svg>
  ),
  Up: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M7 14l5-5 5 5"/></svg>
  ),
  Gauge: (p) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M21 12a9 9 0 10-18 0"/><path d="M12 12l6-2"/></svg>
  )
};

/****************************** TOP BAR ******************************/
function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const date = now.toLocaleDateString();
  return (
    <div className="text-right select-none leading-tight">
      <div className="text-[clamp(16px,2vw,36px)] font-bold">{time}</div>
      <div className="text-[clamp(10px,1.2vw,20px)] text-zinc-400">{date}</div>
    </div>
  );
}

/**************************** DRIVE HELPERS ***************************/
function extractGoogleDriveId(url) {
  if (!url) return null;
  try {
    const m1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/); if (m1) return m1[1];
    const m2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/); if (m2) return m2[1];
    const m3 = url.match(/uc\?.*id=([a-zA-Z0-9_-]+)/); if (m3) return m3[1];
    return null;
  } catch { return null; }
}
const isDrive = (u) => !!u && u.includes("drive.google.com");
const bust = (u, k) => (!u || !k) ? u : u + (u.includes("?") ? "&" : "?") + `bust=${k}`;
function imageVariant(fileId, attempt) {
  if (attempt === 0) return `https://drive.google.com/uc?export=download&id=${fileId}`;
  if (attempt === 1) return `https://drive.google.com/uc?export=view&id=${fileId}`;
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`;
}
function driveVideo(url) {
  if (!url) return { candidates: [], iframe: undefined };
  if (!isDrive(url)) return { candidates: [url], iframe: undefined };
  const id = extractGoogleDriveId(url);
  if (!id) return { candidates: [], iframe: undefined };
  return {
    candidates: [
      `https://drive.google.com/uc?export=download&id=${id}`,
      `https://drive.google.com/uc?export=preview&id=${id}`,
      `https://drive.google.com/uc?export=view&id=${id}`,
    ],
    iframe: `https://drive.google.com/file/d/${id}/preview`,
  };
}

/*************************** MEDIA PANELS *****************************/
function MediaPlaceholder({ icon: IconEl, title, subtitle }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center text-center text-zinc-300">
      <IconEl className="mb-3 h-8 w-8 opacity-60" />
      <div className="text-[clamp(12px,1.4vw,20px)] font-semibold">{title}</div>
      {subtitle ? <div className="text-[clamp(10px,1vw,16px)] opacity-70">{subtitle}</div> : null}
    </div>
  );
}
function VideoPlayer({ sources, iframe, bustKey }) {
  const [idx, setIdx] = useState(0);
  const [fallback, setFallback] = useState(false);
  if (fallback && iframe) {
    return (
      <iframe
        src={bust(iframe, bustKey)}
        className="h-full w-full rounded-2xl"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        title="Video"
      />
    );
  }
  const src = bust(sources[idx], bustKey);
  return (
    <video
      key={src}
      className="h-full w-full rounded-2xl"
      autoPlay loop muted playsInline
      onEnded={(e)=>{ try{ e.currentTarget.currentTime=0; e.currentTarget.play(); }catch{}}}
      onLoadedMetadata={(e)=>{ try{ e.currentTarget.play(); }catch{}}}
      onError={()=>{ if (idx < sources.length - 1) setIdx(idx+1); else if (iframe) setFallback(true); }}
    >
      <source src={src} />
    </video>
  );
}

/****************************** KPI CARDS *****************************/
function StatCard({ label, value, delta, good=true }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-[clamp(10px,1vw,14px)]">{label}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-end justify-between">
          <div className="text-[clamp(24px,3.4vw,56px)] font-extrabold leading-none text-zinc-50">{value}</div>
          {delta != null && (
            <div className={clsx("flex items-center gap-1 text-[clamp(10px,1vw,14px)]", good ? "text-emerald-400" : "text-red-400") }>
              {good ? <Icon.Up className="h-4 w-4"/> : <Icon.Down className="h-4 w-4"/>}
              <span>{delta}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
function PassGauge({ pass=100 }) {
  const pct = Math.max(0, Math.min(100, Number(pass) || 0));
  const r = 42; // radius
  const c = 2 * Math.PI * r; // circumference
  const offset = c - (pct / 100) * c;
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-[clamp(10px,1vw,14px)]">Passing Rate</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center justify-center">
          <svg width="180" height="180" viewBox="0 0 200 200">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#22c55e"/>
                <stop offset="100%" stopColor="#86efac"/>
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={r} stroke="#27272a" strokeWidth="16" fill="none" />
            <circle
              cx="100" cy="100" r={r}
              stroke="url(#g)" strokeWidth="16" fill="none"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={offset}
              transform="rotate(-90 100 100)"
            />
            <text x="100" y="108" textAnchor="middle" className="fill-emerald-400" style={{fontSize: "32px", fontWeight: 800}}>{pct}%</text>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
function DefectPills({ defects }) {
  const items = (Array.isArray(defects) ? defects : []).slice(0, 5);
  if (!items.length) return (
    <Card className="h-full">
      <CardHeader className="pb-2"><CardTitle className="text-[clamp(12px,1.4vw,22px)] font-extrabold">Top Defects</CardTitle></CardHeader>
      <CardContent className="h-[160px] flex items-center justify-center"><MediaPlaceholder IconEl={Icon.Alert} title="No defects to show" /></CardContent>
    </Card>
  );
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-[clamp(12px,1.4vw,22px)] font-extrabold">Top Defects</CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="flex flex-wrap gap-2">
          {items.map((d, i) => (
            <Badge key={i} className="bg-red-500/15 text-red-300 border-red-500/30">
              <span className="mr-2"><Icon.Alert className="h-4 w-4"/></span>
              {typeof d === 'string' ? d : String(d)}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/******************************* MAIN ********************************/
export default function ProductionRowDashboard({
  title = "Line A • Quality Monitor",
  imageSrc,
  videoSrc,
  defects = ["Oil stain", "Needle mark", "Broken stitch"],
  passingRatePct = 96,
  rejectPct = 1.8,
  overallDHUPct = 3.6,
  autoRefreshSeconds = 0, // >0 enables periodic cache-bust of media URLs
}) {
  const [imgError, setImgError] = useState(false);
  const [imgAttempt, setImgAttempt] = useState(0);
  const [bustKey, setBustKey] = useState("");

  // Wake lock for TVs/kiosks (best effort)
  useEffect(() => {
    let lock; let cancelled=false;
    (async () => { try { if (navigator.wakeLock && !cancelled) lock = await navigator.wakeLock.request("screen"); } catch {} })();
    return () => { cancelled = true; try { lock?.release?.(); } catch {} };
  }, []);

  // Optional periodic cache-bust
  useEffect(() => {
    if (!autoRefreshSeconds || autoRefreshSeconds <= 0) return;
    const t = setInterval(() => setBustKey(String(Date.now())), Math.max(5000, autoRefreshSeconds * 1000));
    return () => clearInterval(t);
  }, [autoRefreshSeconds]);

  const finalImageSrc = useMemo(() => {
    if (!imageSrc) return "";
    let url = imageSrc;
    if (isDrive(imageSrc)) {
      const id = extractGoogleDriveId(imageSrc); if (!id) return "";
      url = imageVariant(id, Math.min(imgAttempt, 2));
    }
    return bust(url, bustKey);
  }, [imageSrc, imgAttempt, bustKey]);

  const videoData = useMemo(() => driveVideo(videoSrc), [videoSrc]);

  const healthGood = passingRatePct >= 95 && rejectPct <= 2 && overallDHUPct <= 5;

  return (
    <div className="w-screen h-screen overflow-hidden bg-[radial-gradient(1200px_800px_at_10%_10%,#052e2b,transparent),radial-gradient(1200px_800px_at_90%_90%,#1a2e05,transparent)] bg-black text-white p-4">
      <div className="grid grid-cols-12 gap-4 h-full">
        {/* HEADER */}
        <div className="col-span-12 flex items-center justify-between">
          <h1 className="font-extrabold tracking-tight text-[clamp(18px,3vw,44px)]">{title}</h1>
          <div className="flex items-center gap-3">
            <Badge className={clsx(healthGood ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30" : "bg-red-500/20 text-red-300 border-red-400/30") }>
              {healthGood ? (<><Icon.Check className="mr-2 h-4 w-4"/>Stable</>) : (<><Icon.Alert className="mr-2 h-4 w-4"/>Attention</>)}
            </Badge>
            <Clock />
          </div>
        </div>

        {/* LEFT: MEDIA (spans 7 cols) */}
        <div className="col-span-12 lg:col-span-7">
          <Card className="shadow-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-[clamp(12px,1.2vw,18px)] flex items-center gap-2">
                <Icon.Play className="h-5 w-5 text-emerald-400"/> Live Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[58vh] md:h-[64vh] w-full overflow-hidden rounded-2xl bg-black">
                {videoData.candidates?.length ? (
                  <VideoPlayer sources={videoData.candidates} iframe={videoData.iframe} bustKey={bustKey} />
                ) : (
                  <MediaPlaceholder IconEl={Icon.Play} title="No video" subtitle="Provide a Google Drive link" />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: KPIs (spans 5 cols) */}
        <div className="col-span-12 lg:col-span-5 grid grid-rows-6 gap-4">
          {/* Image */}
          <Card className="row-span-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-[clamp(12px,1.2vw,18px)] flex items-center gap-2">
                <Icon.Image className="h-5 w-5 text-cyan-400"/> Reference Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[24vh] md:h-[28vh] w-full overflow-hidden rounded-2xl bg-black flex items-center justify-center">
                {finalImageSrc && !imgError ? (
                  <img
                    src={finalImageSrc}
                    alt="Ref"
                    className="h-full w-full object-contain select-none"
                    onError={() => { if (imgAttempt < 2) setImgAttempt(imgAttempt + 1); else setImgError(true); }}
                  />
                ) : finalImageSrc && imgError ? (
                  <MediaPlaceholder IconEl={Icon.Image} title="Image failed" subtitle="Check Drive sharing & ID" />
                ) : (
                  <MediaPlaceholder IconEl={Icon.Image} title="No image" subtitle="Provide a Google Drive link" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="row-span-3 grid grid-cols-2 gap-4">
            <PassGauge pass={Number(passingRatePct) || 0} />
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-[clamp(12px,1.4vw,22px)] font-extrabold">Quality KPIs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-zinc-300 text-[clamp(10px,1vw,16px)]">
                      <span>Reject</span><span className="font-bold text-red-300">{rejectPct}%</span>
                    </div>
                    <Progress value={Math.min(100, Number(rejectPct) || 0)} className="mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-zinc-300 text-[clamp(10px,1vw,16px)]">
                      <span>Overall DHU</span><span className="font-bold text-emerald-300">{overallDHUPct}%</span>
                    </div>
                    <Progress value={Math.min(100, Number(overallDHUPct) || 0)} className="mt-2" />
                  </div>
                  <Separator className="my-2" />
                  <DefectPills defects={defects} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FOOTER TICKER */}
        <div className="col-span-12">
          <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-md px-4 py-2 flex items-center gap-3 text-[clamp(10px,1vw,14px)]">
            <Icon.Gauge className="h-4 w-4 text-emerald-400"/>
            <span className="text-zinc-300">Last updated:</span>
            <span className="font-semibold text-zinc-100">{new Date().toLocaleTimeString()}</span>
            <span className="mx-2 text-zinc-700">•</span>
            <span className="text-zinc-400">Auto-refresh</span>
            <span className="font-semibold text-emerald-300">{autoRefreshSeconds > 0 ? `${autoRefreshSeconds}s` : "Off"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
