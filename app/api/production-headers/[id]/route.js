// app/api/production-headers/[id]/route.js
import { dbConnect } from "@/services/mongo";
import { ProductionHeaderModel } from "@/models/ProductionHeader-model";

function parseOptionalNumber(value, fieldName, errors) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null; // allow clearing
  const num = Number(value);
  if (Number.isNaN(num)) {
    errors.push(`${fieldName} must be a number`);
    return undefined;
  }
  return num;
}

// 🔹 Robust helper: get id from context OR from URL path
function getIdFromContextOrUrl(request, context) {
  const fromParams = context?.params?.id ?? context?.id;
  if (fromParams) return fromParams;

  try {
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1];
  } catch {
    return undefined;
  }
}

// 🔸 GET /api/production-headers/:id
export async function GET(request, context) {
  try {
    await dbConnect();

    const id = getIdFromContextOrUrl(request, context);
    if (!id) {
      return Response.json(
        { success: false, message: "Route param 'id' is required" },
        { status: 400 }
      );
    }

    const header = await ProductionHeaderModel.findById(id).lean();
    if (!header) {
      return Response.json(
        { success: false, message: "Production header not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: header }, { status: 200 });
  } catch (error) {
    console.error("GET /api/production-headers/[id] error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch production header" },
      { status: 500 }
    );
  }
}

// 🔸 PATCH /api/production-headers/:id
export async function PATCH(request, context) {
  try {
    await dbConnect();

    const id = getIdFromContextOrUrl(request, context);
    if (!id) {
      return Response.json(
        { success: false, message: "Route param 'id' is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const errors = [];
    const update = {};

    const fields = [
      "operatorTo",
      "manpowerPresent",
      "manpowerAbsent",
      "workingHour",
      "planQuantity",
      "planEfficiency",
      "todayTarget",
      "achieve",
      "smv",
    ];

    for (const field of fields) {
      if (field in body) {
        const parsed = parseOptionalNumber(body[field], field, errors);
        if (parsed !== undefined) {
          update[field] = parsed;
        }
      }
    }

    if (body.productionDate) {
      update.productionDate = body.productionDate;
    }

    if (body.productionUser) {
      update.productionUser = body.productionUser;
    }

    if (body.qualityUser !== undefined) {
      update.qualityUser = body.qualityUser || null;
    }

    if (errors.length > 0) {
      return Response.json({ success: false, errors }, { status: 400 });
    }

    const header = await ProductionHeaderModel.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    ).lean();

    if (!header) {
      return Response.json(
        { success: false, message: "Production header not found" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        success: true,
        data: header,
        message: "Production header updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PATCH /api/production-headers/[id] error:", error);
    return Response.json(
      { success: false, message: "Failed to update production header" },
      { status: 500 }
    );
  }
}

// 🔸 DELETE /api/production-headers/:id
export async function DELETE(request, context) {
  try {
    await dbConnect();

    const id = getIdFromContextOrUrl(request, context);
    if (!id) {
      return Response.json(
        { success: false, message: "Route param 'id' is required" },
        { status: 400 }
      );
    }

    const deleted = await ProductionHeaderModel.findByIdAndDelete(id);

    if (!deleted) {
      return Response.json(
        { success: false, message: "Production header not found" },
        { status: 404 }
      );
    }

    return Response.json(
      { success: true, message: "Production header deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/production-headers/[id] error:", error);
    return Response.json(
      { success: false, message: "Failed to delete production header" },
      { status: 500 }
    );
  }
}
