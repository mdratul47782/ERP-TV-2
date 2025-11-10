// app/DailyInProcessedEndLineInspectionReport/[id]/page.js
// Remove 'use client' - keep it as a server component

import InspectionTopInput from "../../components/InspectionTopInput";
import DefectEntryForm from "../../components/DefectEntryForm";

export default async function DailyInProcessedEndLineInspectionReport({ params }) {
  const { id } = await params; // In Next.js 15+
  // const { id } = params; // In Next.js 14 and below
console.log("Report ID:", id);
  return (
    <div className="text-black">
      <InspectionTopInput id={id} />
      <DefectEntryForm id={id} />
    </div>
  );
}