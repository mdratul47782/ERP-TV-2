// ============================================
// 1. Server Component: app/quality-summary/page.jsx
// ============================================
import QualitySummaryComponent from "@/app/components/QualitySummaryComponent";
import { HourlyInspectionModel } from "@/models/hourly-inspection-model";
import { ProductionInputModel } from "@/models/production-input-model";
import { RegisterModel } from "@/models/register-model";
import { userModel } from "@/models/user-model";
import MediaLink from "@/models/MediaLink";

export const revalidate = 0;

/* ------------ serializers ------------ */
function serializeHourly(docs) {
  return (docs || []).map((doc) => ({
    ...doc,
    _id: doc._id?.toString(),
    reportDate: doc.reportDate ? new Date(doc.reportDate).toISOString() : null,
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
    user: doc.user ? { ...doc.user, id: doc.user.id ? doc.user.id.toString() : null } : null,
    lineInfo: doc.lineInfo
      ? { ...doc.lineInfo, registerId: doc.lineInfo.registerId ? doc.lineInfo.registerId.toString() : null }
      : null,
    selectedDefects: Array.isArray(doc.selectedDefects)
      ? doc.selectedDefects.map((d) => ({ name: d.name, quantity: Number(d.quantity ?? 0) }))
      : [],
  }));
}

function serializeRegister(docs) {
  return (docs || []).map((doc) => ({
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

function serializePlain(docs) {
  return JSON.parse(JSON.stringify(docs ?? []));
}

function serializeMediaLinks(docs) {
  return (docs || []).map((doc) => ({
    _id: doc._id?.toString(),
    user: doc.user ? { 
      id: doc.user.id ? doc.user.id.toString() : null,
      user_name: doc.user.user_name || ""
    } : null,
    imageSrc: doc.imageSrc || "",
    videoSrc: doc.videoSrc || "",
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  }));
}

/* ------------ server component ------------ */
export default async function QualitySummary() {
  const hourly = await HourlyInspectionModel.find({}).lean();
  const production = await ProductionInputModel.find({}).lean();
  const registers = await RegisterModel.find({}).lean();
  const users = await userModel.find({}).lean();
  const mediaLinks = await MediaLink.find({}).lean();

  const safeHourly = serializeHourly(hourly);
  const safeRegister = serializeRegister(registers);
  const safeProduction = serializePlain(production);
  const safeUsers = serializePlain(users);
  const safeMediaLinks = serializeMediaLinks(mediaLinks);

  return (
    <QualitySummaryComponent
      hourlyData={safeHourly}
      allHourlyData={safeHourly}
      productionData={safeProduction}
      registerData={safeRegister}
      users={safeUsers}
      mediaLinks={safeMediaLinks}
    />
  );
}

