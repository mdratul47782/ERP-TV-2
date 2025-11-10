import { RegisterModel } from "@/models/register-model";
import { dbConnect } from "@/services/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { buyer, building, floor, line, created_by } = body;

    if (!buyer || !building || !floor || !line || !created_by) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields including created_by are required",
        },
        { status: 400 }
      );
    }

    const record = await RegisterModel.create({
      buyer,
      building,
      floor,
      line,
      created_by, // ✅ Save created_by here
    });

    return NextResponse.json(
      { success: true, message: "Record saved successfully", data: record },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error saving record:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
