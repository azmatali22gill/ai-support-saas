import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { KnowledgeBase } from "@/models/KnowledgeBase";
import { ChatSession } from "@/models/ChatSession";
import { generateEmbedding, openai } from "@/lib/openai";

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { orgId, sessionId, message } = body;

    // 1. Validation
    if (!orgId || !message) {
      return NextResponse.json(
        { error: "Missing required fields: orgId or message" },
        { status: 400 },
      );
    }

    // Convert string orgId to Mongoose ObjectId for aggregation queries
    const objectIdOrgId = new mongoose.Types.ObjectId(orgId);

    // 2. Generate vector embedding for the incoming user question
    const queryVector = await generateEmbedding(message);

    // 3. Execute MongoDB Atlas Vector Search to retrieve the top 2 matching document chunks
    const matchingContextDocs = await KnowledgeBase.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", // The exact name you gave your index in Atlas UI
          path: "embeddings",
          queryVector: queryVector,
          numCandidates: 20, // Initial search pool matching similarity bounds
          limit: 2, // Return top 2 matching blocks
        },
      },
      {
        $match: { orgId: objectIdOrgId }, // Security filter: Isolate multi-tenant context boundaries
      },
    ]);

    // 4. Combine retrieved document text chunks to feed as system context
    const contextText =
      matchingContextDocs.length > 0
        ? matchingContextDocs.map((doc) => doc.textChunk).join("\n\n")
        : "No company documentation found for this query.";

    // 5. Generate Response (with built-in fallback for out-of-quota keys)
    let aiResponseText = "";
    try {
      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an AI support agent. Answer the user question using ONLY the provided company context. If the answer cannot be found in the context, politely say you don't know.\n\nContext:\n${contextText}`,
          },
          { role: "user", content: message },
        ],
      });
      aiResponseText =
        chatCompletion.choices[0].message.content ||
        "I couldn't process an answer.";
    } catch (apiError: any) {
      // FALLBACK BLOCK: If OpenAI account is out of credits, run this local text resolver simulation
      console.warn(
        "OpenAI API limit hit, invoking semantic fallback response logic.",
      );
      if (matchingContextDocs.length > 0) {
        aiResponseText = `[AI Support - Local Simulation Mode]: Based on our company documentation: "${matchingContextDocs[0].textChunk}"`;
      } else {
        aiResponseText =
          "Hello! I am in simulation mode and couldn't find any relevant context matching your request in our database.";
      }
    }

    // 6. Save or update the Conversation History log inside MongoDB Atlas
    let currentSession;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      // Append to existing history logs
      currentSession = await ChatSession.findByIdAndUpdate(
        sessionId,
        {
          $push: {
            messages: [
              { sender: "user", content: message },
              { sender: "ai", content: aiResponseText },
            ],
          },
        },
        { new: true },
      );
    } else {
      // Initialize an entirely fresh chat history container
      currentSession = await ChatSession.create({
        orgId: objectIdOrgId,
        status: "ai_active",
        messages: [
          { sender: "user", content: message },
          { sender: "ai", content: aiResponseText },
        ],
      });
    }

    // 7. Deliver response back to the client
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
