import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { KnowledgeBase } from "@/models/KnowledgeBase";
import { ChatSession } from "@/models/ChatSession";
import { generateEmbedding } from "@/lib/openai";
import { generateChatResponse } from "@/lib/openai"; // Import Gemini chat handler

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { orgId, sessionId, message } = body;

    if (!orgId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: orgId or message" },
        { status: 400 },
      );
    }

    // Generate our stable 1536-dimensional vector embedding locally
    const queryVector = await generateEmbedding(message);

    // 1. FLEXIBLE SMART SEARCH LAYER:
    // We try to pull data matching either the ObjectId or the raw String representation
    let matchingContextDocs = await KnowledgeBase.find({
      $or: [{ orgId: orgId }, { orgId: new mongoose.Types.ObjectId(orgId) }],
      // Match keywords anywhere inside your text chunk string fields
      textChunk: { $regex: new RegExp(message.trim().split(" ")[0], "i") },
    })
      .limit(2)
      .lean();

    // 2. If the flexible finder comes up short, sweep the entire org configuration collection
    if (matchingContextDocs.length === 0) {
      matchingContextDocs = await KnowledgeBase.find({
        $or: [{ orgId: orgId }, { orgId: new mongoose.Types.ObjectId(orgId) }],
      })
        .limit(1)
        .lean();
    }

    // 3. Extract text chunk context configurations cleanly
    const contextText =
      matchingContextDocs.length > 0
        ? matchingContextDocs.map((doc) => doc.textChunk).join("\n\n")
        : "No company documentation found for this query.";

    // 4. Fire the retrieved information chunks straight into Google Gemini 1.5 Flash
    const aiResponseText = await generateChatResponse(contextText, message);

    // 5. Update or create the active live Conversation History logs inside MongoDB Atlas
    const objectIdOrgId = mongoose.Types.ObjectId.isValid(orgId)
      ? new mongoose.Types.ObjectId(orgId)
      : new mongoose.Types.ObjectId(); // Fallback generation string safely

    let currentSession;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      currentSession = await ChatSession.findByIdAndUpdate(
        sessionId,
        {
          $push: {
            messages: [
              { sender: "user", content: message },
              { sender: "agent", content: aiResponseText }, // Save log under agent sender
            ],
          },
        },
        { new: true },
      );
    } else {
      currentSession = await ChatSession.create({
        orgId: objectIdOrgId,
        status: "ai_active",
        messages: [
          { sender: "user", content: message },
          { sender: "agent", content: aiResponseText },
        ],
      });
    }

    return NextResponse.json(
      {
        success: true,
        sessionId: currentSession._id,
        response: aiResponseText,
        contextMatchedCount: matchingContextDocs.length,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("RAG Pipeline Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
