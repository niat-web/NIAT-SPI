import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// IMP-1: pre-aggregated, unrestricted (all-campus) dashboard rollups, computed
// once per sync. The super-admin/admin/hod dashboard reads this single tiny
// document instead of scanning the whole snapshot collection per request.
const DashboardSummarySchema = new Schema(
  {
    // Single fixed key so we always upsert the one global summary document.
    key: { type: String, default: "global", unique: true, index: true },
    campuses: { type: Array, default: [] },
    subjects: { type: Array, default: [] },
    sections: { type: Array, default: [] },
    syncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export type DashboardSummaryDoc = InferSchemaType<typeof DashboardSummarySchema> & {
  _id: mongoose.Types.ObjectId;
};

export const DashboardSummary: Model<DashboardSummaryDoc> =
  (mongoose.models.DashboardSummary as Model<DashboardSummaryDoc>) ||
  mongoose.model<DashboardSummaryDoc>("DashboardSummary", DashboardSummarySchema);
