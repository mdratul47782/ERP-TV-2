// app/api/hourly-inspections/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/services/mongo";
import { HourlyInspectionModel } from "@/models/hourly-inspection-model";

function startOfDay(dateLike) {
  const d = dateLike ? new Date(dateLike) : new Date();
  return new Date(d.toDateString());
}
function toNumber(n, def = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}
function normalizeEntry(raw) {
  const hourLabel = raw.hour || raw.hourLabel || "";
  const selectedDefects = Array.isArray(raw.selectedDefects)
    ? raw.selectedDefects.map((d) => ({
        name: String(d.name || "").trim(),
        quantity: toNumber(d.quantity, 0),
      }))
    : [];

  const doc = {
    hourLabel,
    hourIndex:
      raw.hourIndex ||
      (hourLabel && Number((hourLabel.match(/^(\d+)/) || [null, 0])[1])) ||
      0,
    inspectedQty: toNumber(raw.inspectedQty, 0),
    passedQty: toNumber(raw.passedQty, 0),
    defectivePcs: toNumber(raw.defectivePcs, 0),
    afterRepair: toNumber(raw.afterRepair, 0),
    selectedDefects,
  };

  if (raw.lineInfo) {
    const { buyer, building, floor, line, registerId } = raw.lineInfo || {};
    doc.lineInfo = {
      buyer: buyer || undefined,
      building: building || undefined,
      floor: floor || undefined,
      line: line || undefined,
      registerId: registerId || undefined,
    };
  }
  return doc;
}

// ---------- POST ----------
export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const userId = body.userId || body.user_id || body.created_by?.id;
    const user_name =
      body.userName || body.user_name || body.created_by?.user_name;

    if (!userId || !user_name) {
      return NextResponse.json(
        { success: false, message: "userId এবং userName দুটোই প্রয়োজন।" },
        { status: 400 }
      );
    }
    if (!mongoose.isValidObjectId(userId)) {
      return NextResponse.json(
        { success: false, message: "Invalid userId (not ObjectId)." },
        { status: 400 }
      );
    }

    const reportDate = startOfDay(body.reportDate);

    let rawEntries = [];
    if (Array.isArray(body.entries)) rawEntries = body.entries;
    else if (Array.isArray(body.hours)) rawEntries = body.hours;
    else if (body.entry) rawEntries = [body.entry];
    else if (body.hour) rawEntries = [body.hour];
    else rawEntries = [body];

    const docs = rawEntries.map((e) => ({
      ...normalizeEntry(e),
      user: { id: new mongoose.Types.ObjectId(userId), user_name },
      reportDate,
    }));

    // ✅ শুধুই hourLabel/hourIndex চেক রাখছি
    for (const d of docs) {
      if (!d.hourLabel || !d.hourIndex) {
        return NextResponse.json(
          { success: false, message: "hourLabel/hourIndex is required." },
          { status: 400 }
        );
      }
      // ❌ equality check removed
    }

    try {
      const inserted = await HourlyInspectionModel.insertMany(docs, {
        ordered: false,
      });
      return NextResponse.json(
        {
          success: true,
          count: inserted.length,
          data: inserted,
          message: "Hourly inspection entries created.",
        },
        { status: 201 }
      );
    } catch (err) {
      if (err?.code === 11000) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Duplicate entry: same user + date + hour already exists.",
            code: 11000,
          },
          { status: 409 }
        );
      }
      throw err;
    }
  } catch (err) {
    console.error("POST /hourly-inspections error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

// ---------- GET ----------
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");
    const limit = Math.min(Number(searchParams.get("limit") || 200), 1000);

    const filter = {};
    if (userId) {
      if (!mongoose.isValidObjectId(userId)) {
        return NextResponse.json(
          { success: false, message: "Invalid userId (not ObjectId)." },
          { status: 400 }
        );
      }
      filter["user.id"] = new mongoose.Types.ObjectId(userId);
    }
    if (date) {
      const dayStart = startOfDay(date);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      filter.reportDate = { $gte: dayStart, $lt: dayEnd };
    }

    const rows = await HourlyInspectionModel.find(filter)
      .sort({ reportDate: 1, hourIndex: 1, createdAt: 1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      { success: true, count: rows.length, data: rows },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /hourly-inspections error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}