import { NextResponse } from "next/server";
import { dbConnect } from "@/services/mongo";
import MediaLink from "@/models/MediaLink";

// GET - Fetch user's media links
export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const mediaLink = await MediaLink.findOne({ "user.id": userId });
    return NextResponse.json({ data: mediaLink || null });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new media links
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, userName, imageSrc, videoSrc } = body;

    if (!userId || !userName) {
      return NextResponse.json(
        { error: "userId and userName required" },
        { status: 400 }
      );
    }

    // Check if already exists
    const existing = await MediaLink.findOne({ "user.id": userId });
    if (existing) {
      return NextResponse.json(
        { error: "Media links already exist. Use PATCH to update." },
        { status: 409 }
      );
    }

    const newMediaLink = await MediaLink.create({
      user: { id: userId, user_name: userName },
      imageSrc: imageSrc || "",
      videoSrc: videoSrc || "",
    });

    return NextResponse.json({ data: newMediaLink }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update existing media links
export async function PATCH(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { userId, imageSrc, videoSrc } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const updated = await MediaLink.findOneAndUpdate(
      { "user.id": userId },
      {
        $set: {
          imageSrc: imageSrc || "",
          videoSrc: videoSrc || "",
        },
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Media links not found. Use POST to create." },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}