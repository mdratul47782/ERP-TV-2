// app/api/hourly-productions/route.js
import { dbConnect } from "@/services/mongo";
import { ProductionHeaderModel } from "@/models/ProductionHeader-model";
import { HourlyProductionModel } from "@/models/HourlyProduction-model";

// 🔹 helper for safe number parsing
function toNumberOrZero(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

// 🔹 Compute base hourly target
// Prefer: todayTarget / workingHour (if available)
// Fallback: (manpower * 60 * planEff% / 100) / SMV
function computeBaseTargetPerHour(header) {
  const workingHour = toNumberOrZero(header.workingHour);
  const todayTarget = toNumberOrZero(header.todayTarget);
  const manpowerPresent = toNumberOrZero(header.manpowerPresent);
  const smv = toNumberOrZero(header.smv);
  const planEfficiencyPercent = toNumberOrZero(header.planEfficiency);
  const planEffDecimal = planEfficiencyPercent / 100;

  let targetFromTodayTarget =
    workingHour > 0 ? todayTarget / workingHour : 0;

  let targetFromCapacity =
    manpowerPresent > 0 && smv > 0
      ? (manpowerPresent * 60 * planEffDecimal) / smv
      : 0;

  return targetFromTodayTarget || targetFromCapacity || 0;
}

// 🔸 GET /api/hourly-productions?headerId=...&productionUserId=...
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const headerId = searchParams.get("headerId");
    const productionUserId = searchParams.get("productionUserId");

    if (!headerId) {
      return Response.json(
        { success: false, message: "headerId query param is required" },
        { status: 400 }
      );
    }

    const query = { headerId };
    if (productionUserId) {
      query["productionUser.id"] = productionUserId;
    }

    const records = await HourlyProductionModel.find(query)
      .sort({ hour: 1 })
      .lean();

    return Response.json(
      { success: true, data: records },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/hourly-productions error:", error);
    return Response.json(
      {
        success: false,
        message: "Failed to fetch hourly production records",
      },
      { status: 500 }
    );
  }
}

// 🔸 POST /api/hourly-productions
// Body:
// {
//   headerId: string,
//   hour: number,
//   achievedQty: number,
//   productionUser: { id, Production_user_name, phone, bio }
// }
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const errors = [];

    const headerId = body.headerId;
    const hour = toNumberOrZero(body.hour);
    const achievedQty = toNumberOrZero(body.achievedQty);
    const productionUser = body.productionUser;

    if (!headerId) {
      errors.push("headerId is required");
    }
    if (!hour || hour <= 0) {
      errors.push("hour must be a positive number");
    }
    if (!productionUser || !productionUser.id) {
      errors.push("productionUser.id is required");
    }
    if (!Number.isFinite(achievedQty) || achievedQty < 0) {
      errors.push("achievedQty must be a non-negative number");
    }

    if (errors.length > 0) {
      return Response.json({ success: false, errors }, { status: 400 });
    }

    // 🔹 Load header to get manpower, SMV, efficiency, etc.
    const header = await ProductionHeaderModel.findById(headerId).lean();

    if (!header) {
      return Response.json(
        { success: false, message: "Production header not found" },
        { status: 404 }
      );
    }

    const manpowerPresent = toNumberOrZero(header.manpowerPresent);
    const smv = toNumberOrZero(header.smv);
    const planEfficiencyPercent = toNumberOrZero(header.planEfficiency);
    const planEffDecimal = planEfficiencyPercent / 100;

    // 🔹 Base hourly target at plan efficiency
    const baseTargetPerHour = computeBaseTargetPerHour(header);

    // 🔹 Load previous hours for carry-over calculation
    const previousRecords = await HourlyProductionModel.find({
      headerId,
      "productionUser.id": productionUser.id,
      hour: { $lt: hour },
    })
      .sort({ hour: 1 })
      .lean();

    let shortfallUntilPrev = 0;

    for (const rec of previousRecords) {
      const prevTarget = toNumberOrZero(
        rec.dynamicTarget ?? rec.baseTargetPerHour
      );
      const prevAchieved = toNumberOrZero(rec.achievedQty);
      shortfallUntilPrev += prevTarget - prevAchieved;
    }

    // 🔹 Dynamic target for this hour: base + previous shortfall
    const dynamicTarget = baseTargetPerHour + shortfallUntilPrev;

    // 🔹 Variance for this hour
    const varianceQty = dynamicTarget - achievedQty;

    // 🔹 Hourly efficiency (this hour)
    //   Hourly Eff % = Hourly Output * SMV / (Manpower * 60) * 100
    const hourlyEfficiency =
      manpowerPresent > 0 && smv > 0
        ? (achievedQty * smv * 100) / (manpowerPresent * 60)
        : 0;

    // 🔹 Achieve Efficiency (your formula)
    //   Formula:
    //   Hourly Output * SMV / (Manpower * 60) * Working Hour
    //   Here Working Hour = current hour number
    const achieveEfficiency =
      manpowerPresent > 0 && smv > 0 && hour > 0
        ? (achievedQty * smv * hour) / (manpowerPresent * 60)
        : 0;

    // 🔹 For now, totalEfficiency = achieveEfficiency (you can change later)
    const totalEfficiency = achieveEfficiency;

    // 🔹 Doc to save
    const doc = {
      headerId,
      hour,
      achievedQty,
      baseTargetPerHour,
      dynamicTarget,
      varianceQty,
      hourlyEfficiency,
      achieveEfficiency,
      totalEfficiency,
      productionUser: {
        id: productionUser.id,
        Production_user_name: productionUser.Production_user_name,
        phone: productionUser.phone,
        bio: productionUser.bio,
      },
    };

    // 🔹 Upsert (one record per header + user + hour)
    const existing = await HourlyProductionModel.findOne({
      headerId,
      "productionUser.id": doc.productionUser.id,
      hour,
    });

    let saved;
    if (existing) {
      Object.assign(existing, doc);
      saved = await existing.save();
    } else {
      saved = await HourlyProductionModel.create(doc);
    }

    return Response.json(
      {
        success: true,
        data: saved,
        message: "Hourly production record saved successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/hourly-productions error:", error);
    return Response.json(
      {
        success: false,
        message:
          error.message || "Failed to save hourly production record",
      },
      { status: 500 }
    );
  }
}
