// app/HourlyDashboard/page.js
import HourlyDashboardComponent from "../components/HourlyDashboardComponent";
import { HourlyInspectionModel } from "@/models/hourly-inspection-model";
import { ProductionInputModel } from "@/models/production-input-model";
import { RegisterModel } from "@/models/register-model";
import { userModel } from "@/models/user-model";
import TopThree from "../components/TopThree";

// If you want fresh data during dev
export const revalidate = 0;

/* ------------ serializers ------------ */
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

// generic fallback for other collections (removes ObjectId/Date)
function serializePlain(docs) {
  return JSON.parse(JSON.stringify(docs ?? []));
}

/* ------------ single default export (server component) ------------ */
export default async function HourlyDashboard() {
  // Queries
  const hourly = await HourlyInspectionModel.find({}).lean();
  const production = await ProductionInputModel.find({}).lean();
  const registers = await RegisterModel.find({}).lean();
  const users = await userModel.find({}).lean();

  // Serialize everything for client components
  const safeHourly = serializeHourly(hourly);
  const safeRegister = serializeRegister(registers);
  const safeProduction = serializePlain(production);
  const safeUsers = serializePlain(users);

  return (
    <>
      <HourlyDashboardComponent
        hourlyData={safeHourly}
        allHourlyData={safeHourly}
        productionData={safeProduction}
        registerData={safeRegister}
        users={safeUsers}
      />
      <TopThree
        hourlyData={safeHourly}
        allHourlyData={safeHourly}
        productionData={safeProduction}
        registerData={safeRegister}
        users={safeUsers}
      />
    </>
  );
}
