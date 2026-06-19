import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IKnowledgeBase extends Document {
  orgId: mongoose.Types.ObjectId;
  fileName: string;
  textChunk: string;
  embeddings: number[];
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>({
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  fileName: { type: String, required: true },
  textChunk: { type: String, required: true },
  embeddings: { type: [Number], required: true }, // Crucial layout for Atlas Vector Search
});

export const KnowledgeBase =
  models.KnowledgeBase ||
  model<IKnowledgeBase>("KnowledgeBase", KnowledgeBaseSchema);
