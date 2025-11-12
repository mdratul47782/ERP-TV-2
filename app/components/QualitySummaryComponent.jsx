"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import MediaAndKpisTemplate from "./MediaAndKpisTemplate";

const REFRESH_MS = 5000;

export default function QualitySummaryComponent({
  hourlyData,
  productionData,
  registerData,
  users,
  mediaLinks,
}) {
  const { auth } = useAuth();
  const router = useRouter();

  // silently stamp lastUpdate when data changes (not shown in UI)
  const [lastUpdate, setLastUpdate] = useState(new Date());
  useEffect(() => {
    setLastUpdate(new Date());
  }, [hourlyData, productionData, registerData, users, mediaLinks]);

  // 🔄 silent auto-refresh every 5s (no UI)
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

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

  // Accurate ratios (NOT rounded). Return null when denominator invalid.
  const ratio = (num, den) => {
    const n = Number(num);
    const d = Number(den);
    if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return null;
    return n / d; // e.g., 0.6775 (MediaAndKpisTemplate formats this to 67.75%)
  };

  const rftRatio = useMemo(
    () => ratio(totalPassed, totalInspected),
    [totalPassed, totalInspected]
  );
  const rejectRatio = useMemo(
    () => ratio(totalDefectivePcs, totalInspected),
    [totalDefectivePcs, totalInspected]
  );
  const dhuRatio = useMemo(
    () => ratio(totalDefects, totalInspected),
    [totalDefects, totalInspected]
  );

  // ✅ Top 3 defects across today's hours for this user
  const top3Defects = useMemo(() => {
    const counts = new Map();
    for (const h of todayUserHourly) {
      for (const d of h?.selectedDefects || []) {
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
      {/* No refresh/status UI shown */}
      <MediaAndKpisTemplate
        imageSrc={imageSrc}
        videoSrc={videoSrc}
        defects={top3Defects.length ? top3Defects : ["—", "—", "—"]}
        // Use ratios for precise display; the template's formatter will show two decimals
        rftPct={rftRatio}
        // Provide counts so Defect Rate is computed exactly in the child
        inspectedUnits={totalInspected}
        defectiveUnits={totalDefectivePcs}
        // Overall DHU as a ratio as well
        overallDHUPct={dhuRatio}
        // Optional: keep legacy props for backward-compatibility
        passingRatePct={rftRatio != null ? rftRatio * 100 : 0}
        rejectPct={rejectRatio != null ? rejectRatio * 100 : 0}
      />
    </div>
  );
}
