import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "../lib/constants";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, index: true },
    // Scoping: campus names (institute_name) and subject titles this user covers.
    // Empty arrays => unrestricted (interpreted per-role in rbac.ts).
    campuses: { type: [String], default: [] },
    subjects: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> =
  (mongoose.models.User as Model<UserDoc>) ||
  mongoose.model<UserDoc>("User", UserSchema);
