// app/DailyInProcessedEndLineInspectionReport/[id]/page.js
import mongoose from "mongoose";
import { HourlyInspectionModel } from "@/models/hourly-inspection-model";
import { ProductionInputModel } from "@/models/production-input-model";
import { RegisterModel } from "@/models/register-model";
import { userModel } from "@/models/user-model";
import InspectionTopInput from "../../components/InspectionTopInput";
import DefectEntryForm from "../../components/DefectEntryForm";

export const revalidate = 0; // Always fresh in dev

// ✅ Helper: convert docs to plain JSON-serializable objects
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
    selectedDefects: Array.isArray(doc.selectedDefects)
      ? doc.selectedDefects.map((d) => ({
          name: d.name,
          quantity: Number(d.quantity ?? 0),
        }))
      : [],
  }));
}

// ✅ Helper for RegisterModel
function serializeRegister(docs) {
  return docs.map((doc) => ({
    _id: doc._id?.toString(),
    buyer: doc.buyer || "",
    building: doc.building || "",
    floor: doc.floor || "",
    line: doc.line || "",
    created_by: doc.created_by || "",
    style: doc.style || "",
    item: doc.item || "",
    color: doc.color || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  }));
}

export default async function DailyInProcessedEndLineInspectionReport({ params }) {
  const { id } = await params;
  const registerObjectId = new mongoose.Types.ObjectId(id);

  // ---- Queries ----
  const hourlyData = await HourlyInspectionModel.find({
    "lineInfo.registerId": registerObjectId,
  }).lean();

  const allHourly = await HourlyInspectionModel.find({}).lean();
  const productionData = await ProductionInputModel.find({}).lean();
  const registerData = await RegisterModel.find({}).lean();
  const users = await userModel.find().lean();

  console.log("Fetched registerData:", registerData.length, "records");

  // ---- Serialize for Client Components ----
  const safeAllHourly = serializeHourly(allHourly);
  const safeHourly = serializeHourly(hourlyData);
  const safeRegister = serializeRegister(registerData);

  // ---- Render ----
  return (
    <div className="text-black">
      <InspectionTopInput id={id} registerData={safeRegister} />
      <DefectEntryForm id={id} hourlyData={safeAllHourly} />
    </div>
  );
}
