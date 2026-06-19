import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { ChatSession } from "@/models/ChatSession";

export async function GET(request: Request) {
  try {
    await connectDB();

    // Extract the orgId from the URL query parameters
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json(
        { error: "Missing orgId parameter" },
        { status: 400 },
      );
    }

    // Fetch all sessions belonging to this organization, sorted newest first
    const sessions = await ChatSession.find({ orgId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, sessions }, { status: 200 });
  } catch (error: any) {
    console.error("Dashboard Chats Fetch Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
