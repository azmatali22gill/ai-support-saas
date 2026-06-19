import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { KnowledgeBase } from "@/models/KnowledgeBase";
import { generateEmbedding } from "@/lib/openai";

// Helper function to split long text into smaller segments (chunks)
function splitTextIntoChunks(text: string, maxLength: number = 600): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const chunks: string[] = [];
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
}

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { orgId, fileName, content } = body;

    // Validate inputs
    if (!orgId || !fileName || !content) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, fileName, or content" },
        { status: 400 },
      );
    }

    // Step 1: Chunk the text so OpenAI can process it efficiently without losing context
    const textChunks = splitTextIntoChunks(content, 500);
    const savedDocuments = [];

    // Step 2: Process each chunk, get its vector from OpenAI, and save it to MongoDB Atlas
    for (const chunk of textChunks) {
      const vectorEmbedding = await generateEmbedding(chunk);

      const newKBEntry = await KnowledgeBase.create({
        orgId,
        fileName,
        textChunk: chunk,
        embeddings: vectorEmbedding, // Array of 1536 floating points
      });

      savedDocuments.push(newKBEntry._id);
    }

    return NextResponse.json(
      {
        success: true,
        message: `Successfully ingested ${fileName}. Created ${textChunks.length} vector chunks.`,
        chunksProcessed: textChunks.length,
        documentIds: savedDocuments,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Ingestion Pipeline Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
