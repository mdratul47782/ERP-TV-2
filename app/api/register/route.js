import { RegisterModel } from "@/models/register-model";
import { dbConnect } from "@/services/mongo";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      buyer,
      building,
      floor,
      line,
      style,
      item,
      color,
      smv,
      runDay,
      created_by,
    } = body;

    if (
      !buyer ||
      !building ||
      !floor ||
      !line ||
      !style ||
      !item ||
      !color ||
      !smv ||
      !runDay ||
      !created_by
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields are required",
        },
        { status: 400 }
      );
    }

    const record = await RegisterModel.create({
      buyer,
      building,
      floor,
      line,
      style,
      item,
      color,
      smv,
      runDay,
      created_by,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Record saved successfully",
        data: record,
      },
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

// GET: Fetch records by created_by
export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const created_by = searchParams.get("created_by");

    if (!created_by) {
      return NextResponse.json(
        { success: false, message: "created_by parameter is required" },
        { status: 400 }
      );
    }

    const records = await RegisterModel.find({ created_by }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      { success: true, data: records },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching records:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// PUT: Update a record
export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      id,
      buyer,
      building,
      floor,
      line,
      style,
      item,
      color,
      smv,
      runDay,
      created_by,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Record ID is required" },
        { status: 400 }
      );
    }

    // Verify the record belongs to the user
    const existingRecord = await RegisterModel.findById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }

    if (existingRecord.created_by !== created_by) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only edit your own records",
        },
        { status: 403 }
      );
    }

    const updatedRecord = await RegisterModel.findByIdAndUpdate(
      id,
      { buyer, building, floor, line, style, item, color, smv, runDay },
      { new: true, runValidators: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Record updated successfully",
        data: updatedRecord,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating record:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}

// DELETE: Delete a record
export async function DELETE(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const created_by = searchParams.get("created_by");

    if (!id || !created_by) {
      return NextResponse.json(
        { success: false, message: "ID and created_by are required" },
        { status: 400 }
      );
    }

    const existingRecord = await RegisterModel.findById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { success: false, message: "Record not found" },
        { status: 404 }
      );
    }

    if (existingRecord.created_by !== created_by) {
      return NextResponse.json(
        {
          success: false,
          message: "You can only delete your own records",
        },
        { status: 403 }
      );
    }

    await RegisterModel.findByIdAndDelete(id);

    return NextResponse.json(
      { success: true, message: "Record deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting record:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
