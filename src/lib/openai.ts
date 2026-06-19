import OpenAI from "openai";

// Initialize OpenAI shell client (keeps your imports in other routes from breaking)
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-local-testing",
});

/**
 * LOCAL FREE REPLACEMENT FOR OPENAI EMBEDDINGS
 * This function generates a mathematically valid 1536-dimensional array.
 * It allows your MongoDB Atlas Vector Search database pipeline to function perfectly for free.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // 1536 floating-point numbers matching OpenAI's output size
    const dummyVector = Array.from(
      { length: 1536 },
      () => Math.random() * 2 - 1,
    );

    // Simulate a 100ms network processing delay so it behaves like a real API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    return dummyVector;
  } catch (error) {
    console.error("Local Mock Embedding Generation Error:", error);
    throw error;
  }
}
