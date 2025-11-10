// app/DailyInProcessedEndLineInspectionReport/[id]/page.js
import mongoose from "mongoose";
import { HourlyInspectionModel } from "@/models/hourly-inspection-model";
import { ProductionInputModel } from "@/models/production-input-model";
import { RegisterModel } from "@/models/register-model";
import { userModel } from "@/models/user-model";
import InspectionTopInput from "../../components/InspectionTopInput";
import DefectEntryForm from "../../components/DefectEntryForm";

// If you want fresh data in dev:
export const revalidate = 0;

// helper: make data safe for Client Components
function serializeHourly(docs) {
  return docs.map((doc) => ({
    ...doc,
    _id: doc._id?.toString(),
    reportDate: doc.reportDate ? new Date(doc.reportDate).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    user: doc.user
      ? {
          ...doc.user,
          id: doc.user.id ? doc.user.id.toString() : null,
        }
      : null,
    lineInfo: doc.lineInfo
      ? {
          ...doc.lineInfo,
          registerId: doc.lineInfo.registerId
            ? doc.lineInfo.registerId.toString()
            : null,
        }
      : null,
    // ensure nested arrays are plain:
    selectedDefects: Array.isArray(doc.selectedDefects)
      ? doc.selectedDefects.map((d) => ({
          name: d.name,
          quantity: Number(d.quantity ?? 0),
        }))
      : [],
  }));
}

export default async function DailyInProcessedEndLineInspectionReport({ params }) {
  const { id } = await params; // Next 15; on 14 use: const { id } = params;

  // Cast route id for queries that match ObjectId fields
  const registerObjectId = new mongoose.Types.ObjectId(id);

  // Queries (lean -> plain objects, but still contain ObjectId/Date instances)
  const hourlyData = await HourlyInspectionModel.find({
    "lineInfo.registerId": registerObjectId,
  }).lean();

  const allHourly = await HourlyInspectionModel.find({}).lean();

  const productionData = await ProductionInputModel.find({ reportId: id }).lean();
  const registerData = await RegisterModel.find({ _id: registerObjectId }).lean();
  const users = await userModel.find().lean();

  // Optional server logging (Node terminal)
  console.log("ALL Hourly (endline_hour_entries):", allHourly.length);

  // ✅ Serialize any non-plain values before passing to Client Components
  const safeAllHourly = serializeHourly(allHourly);
  const safeHourly = serializeHourly(hourlyData);

  return (
    <div className="text-black">
      <InspectionTopInput id={id} />
      {/* Pass only JSON-serializable data */}
      <DefectEntryForm id={id} hourlyData={safeAllHourly} />
      {/* If you also need the filtered set somewhere: */}
      {/* <DefectEntryForm id={id} hourlyData={safeHourly} /> */}
    </div>
  );
}
