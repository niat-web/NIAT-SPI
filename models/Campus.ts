import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CampusSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, // matches institute_name
    instituteId: { type: String, default: "" },
    code: { type: String, default: "" },
    location: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type CampusDoc = InferSchemaType<typeof CampusSchema> & { _id: mongoose.Types.ObjectId };

export const Campus: Model<CampusDoc> =
  (mongoose.models.Campus as Model<CampusDoc>) ||
  mongoose.model<CampusDoc>("Campus", CampusSchema);
