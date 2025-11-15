// app/api/production-headers/route.js
import { dbConnect } from "@/services/mongo";
import { ProductionHeaderModel } from "@/models/ProductionHeader-model";

// 🔹 Today as "YYYY-MM-DD"
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // e.g. "2025-11-15"
}

// 🔹 Optional number: allow blank
function parseOptionalNumber(value, fieldName, errors) {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  if (Number.isNaN(num)) {
    errors.push(`${fieldName} must be a number`);
    return undefined;
  }
  return num;
}

// 🔸 GET /api/production-headers?productionUserId=...&date=YYYY-MM-DD
//    → Get header for that production user & date (default: today)
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const productionUserId = searchParams.get("productionUserId");
    const date = searchParams.get("date") || getTodayDateString();

    if (!productionUserId) {
      return Response.json(
        { success: false, message: "productionUserId query param is required" },
        { status: 400 }
      );
    }

    const header = await ProductionHeaderModel.findOne({
      "productionUser.id": productionUserId,
      productionDate: date,
    }).lean();

    return Response.json(
      { success: true, data: header || null },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/production-headers error:", error);
    return Response.json(
      { success: false, message: "Failed to fetch production header" },
      { status: 500 }
    );
  }
}

// 🔸 POST /api/production-headers
//    → Upsert header for today (or provided productionDate)
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const errors = [];

    const {
      operatorTo,
      manpowerPresent,
      manpowerAbsent,
      workingHour,
      planQuantity,
      planEfficiency,
      todayTarget,
      achieve,
      productionUser,
      qualityUser,
      productionDate, // optional from client
    } = body;

    // ✅ THIS is where your previous error came from
    if (!productionUser || !productionUser.id) {
      errors.push("productionUser.id is required");
    }

    const date = productionDate || getTodayDateString(); // ALWAYS set productionDate

    const doc = {
      productionDate: date,
      operatorTo: parseOptionalNumber(operatorTo, "operatorTo", errors),
      manpowerPresent: parseOptionalNumber(
        manpowerPresent,
        "manpowerPresent",
        errors
      ),
      manpowerAbsent: parseOptionalNumber(
        manpowerAbsent,
        "manpowerAbsent",
        errors
      ),
      workingHour: parseOptionalNumber(workingHour, "workingHour", errors),
      planQuantity: parseOptionalNumber(planQuantity, "planQuantity", errors),
      planEfficiency: parseOptionalNumber(
        planEfficiency,
        "planEfficiency",
        errors
      ),
      todayTarget: parseOptionalNumber(todayTarget, "todayTarget", errors),
      achieve: parseOptionalNumber(achieve, "achieve", errors),

      // Production user snapshot (no password)
      productionUser: {
        id: productionUser.id,
        Production_user_name: productionUser.Production_user_name,
        phone: productionUser.phone,
        bio: productionUser.bio,
      },

      // Quality user snapshot (optional)
      qualityUser: qualityUser
        ? {
            id: qualityUser.id,
            user_name: qualityUser.user_name,
            phone: qualityUser.phone,
            bio: qualityUser.bio,
          }
        : undefined,
    };

    if (errors.length > 0) {
      return Response.json({ success: false, errors }, { status: 400 });
    }

    // 🔹 Upsert by productionUser.id + productionDate
    const existing = await ProductionHeaderModel.findOne({
      "productionUser.id": doc.productionUser.id,
      productionDate: doc.productionDate,
    });

    let saved;
    if (existing) {
      Object.assign(existing, doc);
      saved = await existing.save();
    } else {
      saved = await ProductionHeaderModel.create(doc);
    }

    return Response.json(
      {
        success: true,
        data: saved,
        message: "Production header saved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/production-headers error:", error);
    return Response.json(
      {
        success: false,
        message: error.message || "Failed to save production header",
      },
      { status: 500 }
    );
  }
}
