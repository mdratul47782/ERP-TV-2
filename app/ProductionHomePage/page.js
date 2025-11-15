// app/ProductionHomePage/page.js
import { dbConnect } from "@/services/mongo";
import { ProductionHeaderModel } from "@/models/ProductionHeader-model";

import ProductionInputForm from "@/app/ProductionComponents/HourlyProductionInput";
import WorkingHourCard from "@/app/ProductionComponents/WorkingHourCard";

export default async function ProductionHomePage() {
  // 🔹 Server-side DB connect
  await dbConnect();

  // 🔹 Get the latest header (you can later filter by date / user if needed)
  const docs = await ProductionHeaderModel.find()
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  const headerDoc = docs[0] || null;
  const header = headerDoc ? JSON.parse(JSON.stringify(headerDoc)) : null;

  return (
    <main className="min-h-screen bg-slate-50 py-6">
      <div className="mx-auto max-w-6xl px-3 space-y-4">
        {/* Page title */}
        <header className="space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">
            Production Dashboard
          </h1>
          <p className="text-sm text-slate-600">
            Set today&apos;s production header and track hourly performance.
          </p>
        </header>

        {/* Two-column layout on desktop, stacked on mobile */}
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)]">
          {/* Left – Header form */}
          <ProductionInputForm />

          {/* Right – Hourly working card */}
          <WorkingHourCard header={header} />
        </section>
      </div>
    </main>
  );
}
