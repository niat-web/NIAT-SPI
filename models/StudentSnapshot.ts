import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

// Nightly backup of BigQuery attendance, for safety/fallback.
const SubjectSchema = new Schema(
  {
    subjectTitle: String,
    totalSessions: Number,
    presentSessions: Number,
    absentSessions: Number,
    attendancePercentage: Number,
  },
  { _id: false },
);

const StudentSnapshotSchema = new Schema(
  {
    studentUserId: { type: String, required: true, unique: true, index: true },
    studentName: String,
    instituteId: String,
    instituteName: { type: String, index: true },
    batchSectionName: { type: String, index: true },
    semesterTitle: String,
    totalSessions: Number,
    presentSessions: Number,
    absentSessions: Number,
    attendancePercentage: Number,
    subjects: { type: [SubjectSchema], default: [] },
    syncedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export type StudentSnapshotDoc = InferSchemaType<typeof StudentSnapshotSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const StudentSnapshot: Model<StudentSnapshotDoc> =
  (mongoose.models.StudentSnapshot as Model<StudentSnapshotDoc>) ||
  mongoose.model<StudentSnapshotDoc>("StudentSnapshot", StudentSnapshotSchema);
