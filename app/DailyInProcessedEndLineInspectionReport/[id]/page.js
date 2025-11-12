import mongoose from "mongoose";
import { HourlyInspectionModel } from "@/models/hourly-inspection-model";
import { ProductionInputModel } from "@/models/production-input-model";
import { RegisterModel } from "@/models/register-model";
import { userModel } from "@/models/user-model";
import InspectionTopInput from "../../components/InspectionTopInput";
import DefectEntryForm from "../../components/DefectEntryForm";

// Disable ISR (always fetch fresh data)
export const revalidate = 0;

// ✅ Helper: safely convert Mongo/Mongoose docs to plain JSON
function safeJson(data) {
  return JSON.parse(JSON.stringify(data));
}

// ✅ Helper: deep serialization for hourly docs
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

// ...same imports

export default async function DailyInProcessedEndLineInspectionReport({ params }) {
  const { id } = await params;
  const registerObjectId = new mongoose.Types.ObjectId(id);

  const [hourlyData, allHourly, productionData, registerData, users] =
    await Promise.all([
      HourlyInspectionModel.find({ "lineInfo.registerId": registerObjectId }).lean(),
      HourlyInspectionModel.find({}).lean(),
      ProductionInputModel.find({}).lean(),
      RegisterModel.find({}).lean(),
      userModel.find({}).lean(),
    ]);

  const safeAllHourly = serializeHourly(allHourly);
  const safeRegisterData = safeJson(registerData);
  const safeProductionData = safeJson(productionData);
  const safeUsers = safeJson(users);

  console.log("✅ Server-side data fetched successfully");

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <InspectionTopInput id={id} registerData={safeRegisterData} theme="light" />
      <DefectEntryForm
        id={id}
        hourlyData={safeAllHourly}
        productionData={safeProductionData}
        registerData={safeRegisterData}
        users={safeUsers}
      />
    </div>
  );
}
