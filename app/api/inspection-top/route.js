// app/api/inspection-top/route.js
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "@/services/mongo";
import { InspectionTopModel } from "@/models/inspection-top-model";

function startOfDay(dateLike) {
  const d = dateLike ? new Date(dateLike) : new Date();
  return new Date(d.toDateString());
}

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

    const {
      building = "",
      floor = "",
      line = "",
      buyer = "",
      style = "",
      item = "",
      color = "",
      reportDate,
    } = body;

    const day = startOfDay(reportDate);

    // upsert filter (user+date+line)
    const filter = {
      "user.id": new mongoose.Types.ObjectId(userId),
      reportDate: day,
      line: line || "",
    };

    const update = {
      $set: {
        user: { id: new mongoose.Types.ObjectId(userId), user_name },
        reportDate: day,
        building,
        floor,
        line,
        buyer,
        style,
        item,
        color,
      },
    };

    const doc = await InspectionTopModel.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });

    return NextResponse.json(
      { success: true, data: doc, message: "Top input saved." },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /inspection-top error:", err);
    // ডুপ্লিকেট হলে unique index কারণে 11000 আসতে পারে, তবে এখানে upsert করেছি
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date"); // YYYY-MM-DD
    const limit = Math.min(Number(searchParams.get("limit") || 50), 200);

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

    const rows = await InspectionTopModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json(
      { success: true, count: rows.length, data: rows },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /inspection-top error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
