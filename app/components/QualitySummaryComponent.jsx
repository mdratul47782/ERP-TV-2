"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import MediaAndKpisTemplate from "./MediaAndKpisTemplate";

const REFRESH_MS = 5000;

/* ---------------------- UI: Refresh / Last-Update bar ---------------------- */
function RefreshStatus({ lastUpdate, nextInMs, refreshing, onForce }) {
  const pct = Math.max(0, Math.min(100, 100 - (nextInMs / REFRESH_MS) * 100));
  const nextSec = Math.ceil(nextInMs / 1000);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between gap-3">
        {/* status pill */}
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-900/20 px-3 py-2">
          {/* dot / spinner */}
          {refreshing ? (
            <span className="inline-flex h-3 w-3">
              <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-300 border-t-transparent animate-spin" />
            </span>
          ) : (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
            </span>
          )}

          <div className="leading-tight">
            <div className="text-[10px] uppercase tracking-wide text-emerald-300">
              Auto-refresh
            </div>
            <div className="text-sm font-semibold text-white">
              {refreshing ? "Refreshing…" : `Next in ${nextSec}s`}
            </div>
          </div>
        </div>

        {/* last updated + manual refresh */}
        {/* <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 hidden sm:inline">Last updated</span>
          <span className="text-sm font-mono text-gray-100 hidden sm:inline">
            {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={onForce}
            className="ml-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 active:scale-[.98] transition"
            title="Refresh now"
          >
            Refresh
          </button>
        </div> */}
      </div>

      {/* progress bar (time until next refresh) */}
      {/* <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-emerald-400 transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div> */}
    </div>
  );
}

export default function QualitySummaryComponent({
  hourlyData,
  productionData,
  registerData,
  users,
  mediaLinks,
}) {
  const { auth } = useAuth();
  const router = useRouter();

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);
  const [nextInMs, setNextInMs] = useState(REFRESH_MS);

  // next scheduled fire time (epoch ms)
  const nextFireAtRef = useRef(Date.now() + REFRESH_MS);
  const refreshTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);

  // when server data changes (from any source), stamp the time
  useEffect(() => {
    setLastUpdate(new Date());
  }, [hourlyData, productionData, registerData, users, mediaLinks]);

  // unified refresh function so UI can show a live state
  const tickRefresh = useCallback(() => {
    setRefreshing(true);
    try {
      router.refresh();
      setLastUpdate(new Date());
    } finally {
      // short grace period so spinner is visible
      setTimeout(() => setRefreshing(false), 600);
      nextFireAtRef.current = Date.now() + REFRESH_MS;
    }
  }, [router]);

  // schedule periodic refresh + lightweight countdown
  useEffect(() => {
    // periodic refresh
    refreshTimerRef.current = setInterval(() => {
      tickRefresh();
    }, REFRESH_MS);

    // live countdown (updates ~10x/sec)
    countdownTimerRef.current = setInterval(() => {
      const msLeft = Math.max(0, nextFireAtRef.current - Date.now());
      setNextInMs(msLeft);
    }, 100);

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [tickRefresh]);

  const onForce = useCallback(() => {
    // manual refresh + reset the cycle
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    tickRefresh();
    refreshTimerRef.current = setInterval(() => {
      tickRefresh();
    }, REFRESH_MS);
  }, [tickRefresh]);

  if (!auth) {
    return (
      <div className="text-center mt-6 text-red-600 font-medium">
        ⚠️ Please log in to view quality summary.
      </div>
    );
  }

  // Find user's media links
  const userMediaLink = useMemo(() => {
    return (Array.isArray(mediaLinks) ? mediaLinks : []).find(
      (link) => link?.user?.user_name === auth.user_name
    );
  }, [mediaLinks, auth.user_name]);

  const imageSrc = userMediaLink?.imageSrc || "";
  const videoSrc = userMediaLink?.videoSrc || "";

  // helpers
  const isToday = (dateStr) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const n = new Date();
    return (
      d.getDate() === n.getDate() &&
      d.getMonth() === n.getMonth() &&
      d.getFullYear() === n.getFullYear()
    );
  };

  const sumBy = (rows, key) =>
    (Array.isArray(rows) ? rows : []).reduce(
      (acc, r) => acc + Number(r?.[key] ?? 0),
      0
    );

  // ✅ filter data: only today's by logged-in user
  const todayUserHourly = useMemo(
    () =>
      (Array.isArray(hourlyData) ? hourlyData : []).filter(
        (h) => h?.user?.user_name === auth.user_name && isToday(h?.reportDate)
      ),
    [hourlyData, auth.user_name]
  );

  // ✅ aggregate KPIs
  const totalInspected = useMemo(
    () => sumBy(todayUserHourly, "inspectedQty"),
    [todayUserHourly]
  );
  const totalPassed = useMemo(
    () => sumBy(todayUserHourly, "passedQty"),
    [todayUserHourly]
  );
  const totalDefectivePcs = useMemo(
    () => sumBy(todayUserHourly, "defectivePcs"),
    [todayUserHourly]
  );
  const totalDefects = useMemo(
    () => sumBy(todayUserHourly, "totalDefects"),
    [todayUserHourly]
  );

  const pct = (num, den) =>
    den ? Math.round((Number(num) / Number(den)) * 100) : 0;

  const passingRatePct = pct(totalPassed, totalInspected);
  const rejectPct = pct(totalDefectivePcs, totalInspected);
  const overallDHUPct = pct(totalDefects, totalInspected);

  // ✅ Top 3 defects across today's hours for this user
  const top3Defects = useMemo(() => {
    const counts = new Map();
    for (const h of todayUserHourly) {
      for (const d of (h?.selectedDefects || [])) {
        const key = d?.name || "Unknown";
        counts.set(key, (counts.get(key) || 0) + Number(d?.quantity ?? 0));
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, qty]) => `${name} (${qty})`);
  }, [todayUserHourly]);

  return (
    <div className="p-3 bg-black h-screen">
      <RefreshStatus
        lastUpdate={lastUpdate}
        nextInMs={nextInMs}
        refreshing={refreshing}
        onForce={onForce}
      />

      <MediaAndKpisTemplate
        imageSrc={imageSrc}
        videoSrc={videoSrc}
        defects={top3Defects.length ? top3Defects : ["—", "—", "—"]}
        passingRatePct={passingRatePct}
        rejectPct={rejectPct}
        overallDHUPct={overallDHUPct}
      />
    </div>
  );
}
