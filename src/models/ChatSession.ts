import mongoose, { Schema, Document, model, models } from "mongoose";

interface IMessage {
  sender: "ai" | "user" | "agent";
  content: string;
  timestamp: Date;
}

export interface IChatSession extends Document {
  orgId: mongoose.Types.ObjectId;
  status: "ai_active" | "human_takeover";
  messages: IMessage[];
  createdAt: Date;
}

const ChatSessionSchema = new Schema<IChatSession>({
  orgId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  status: {
    type: String,
    enum: ["ai_active", "human_takeover"],
    default: "ai_active",
  },
  messages: [
    {
      sender: { type: String, enum: ["ai", "user", "agent"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

export const ChatSession =
  models.ChatSession || model<IChatSession>("ChatSession", ChatSessionSchema);
