// app/ProductionHomePage/page.js
import HourlyProductionInput from "@/app/ProductionComponents/HourlyProductionInput";
import WorkingHourCard from "@/app/ProductionComponents/WorkingHourCard";
import { ProductionHeaderModel } from "@/models/ProductionHeader-model";
import { dbConnect } from "@/services/mongo";

export default async function ProductionHomePage() {
  // 🔹 Ensure DB connection on the server
  await dbConnect();

  // 🔹 Get the latest production header (adjust query if you need per-user/per-date)
  const docs = await ProductionHeaderModel.find()
    .sort({ createdAt: -1 })
    .limit(1)
    .lean();

  const headerDoc = docs[0];

  // 🔹 Convert to a plain JSON-safe object (no ObjectId / Date instances)
  const header = headerDoc ? JSON.parse(JSON.stringify(headerDoc)) : null;

  return (
    <div>
      <HourlyProductionInput />

      {/* 🔹 Client component – now receives a plain object */}
      <WorkingHourCard header={header} />
    </div>
  );
}
