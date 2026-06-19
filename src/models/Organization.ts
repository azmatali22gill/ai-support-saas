import mongoose, { Schema, Document, model, models } from "mongoose";

export interface IOrganization extends Document {
  name: string;
  createdAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const Organization =
  models.Organization ||
  model<IOrganization>("Organization", OrganizationSchema);
