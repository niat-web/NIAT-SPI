import "./env";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../lib/mongodb";
import { User } from "../models/User";
import { Campus } from "../models/Campus";
import { CAMPUSES, SUBJECTS, type Role } from "../lib/constants";

const PASSWORD = "Niat@2026";

interface Seed {
  name: string; email: string; role: Role; campuses?: string[]; subjects?: string[];
}

const C = CAMPUSES;
const S = SUBJECTS;

const seedUsers: Seed[] = [
  // ── Super Admins ──
  { name: "Akhilendar Reddy", email: "superadmin1@nxtwave.co.in", role: "superadmin" },
  { name: "Priya Menon", email: "superadmin2@nxtwave.co.in", role: "superadmin" },
  { name: "Rahul Varma", email: "superadmin3@nxtwave.co.in", role: "superadmin" },
  // ── Admins ──
  { name: "Sandeep Kumar", email: "admin1@nxtwave.co.in", role: "admin" },
  { name: "Divya Rao", email: "admin2@nxtwave.co.in", role: "admin" },
  { name: "Imran Shaikh", email: "admin3@nxtwave.co.in", role: "admin" },
  // ── HODs (all campuses) ──
  { name: "Dr. Lakshmi Narayan", email: "hod1@nxtwave.co.in", role: "hod" },
  { name: "Dr. Venkatesh Iyer", email: "hod2@nxtwave.co.in", role: "hod" },
  { name: "Dr. Anjali Gupta", email: "hod3@nxtwave.co.in", role: "hod" },
  // ── Capability Managers (campus + subjects) ──
  { name: "Kiran Teja", email: "cm1@nxtwave.co.in", role: "capability_manager", campuses: [C[0]], subjects: [S[0], S[2], S[4]] },
  { name: "Meghana Reddy", email: "cm2@nxtwave.co.in", role: "capability_manager", campuses: [C[1]], subjects: [S[7], S[8]] },
  { name: "Arjun Nair", email: "cm3@nxtwave.co.in", role: "capability_manager", campuses: [C[2]], subjects: [S[5], S[6]] },
  // ── BOAs (one campus each) ──
  { name: "Suresh Babu", email: "boa1@nxtwave.co.in", role: "boa", campuses: [C[0]] },
  { name: "Naveen Chandra", email: "boa2@nxtwave.co.in", role: "boa", campuses: [C[1]] },
  { name: "Pooja Sharma", email: "boa3@nxtwave.co.in", role: "boa", campuses: [C[2]] },
  // ── Instructors (campus + subject) ──
  { name: "Ravi Teja", email: "instructor1@nxtwave.co.in", role: "instructor", campuses: [C[0]], subjects: [S[0]] },
  { name: "Sneha Patil", email: "instructor2@nxtwave.co.in", role: "instructor", campuses: [C[1]], subjects: [S[7]] },
  { name: "Vikram Aditya", email: "instructor3@nxtwave.co.in", role: "instructor", campuses: [C[2]], subjects: [S[4]] },
];

async function main() {
  await connectDB();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Campuses
  for (const name of CAMPUSES) {
    await Campus.updateOne({ name }, { $setOnInsert: { name } }, { upsert: true });
  }

  // Users (upsert by email)
  for (const u of seedUsers) {
    await User.updateOne(
      { email: u.email },
      {
        $set: {
          name: u.name, role: u.role,
          campuses: u.campuses ?? [], subjects: u.subjects ?? [], isActive: true,
        },
        $setOnInsert: { passwordHash, createdBy: "seed" },
      },
      { upsert: true },
    );
  }

  const total = await User.countDocuments();
  console.log(`✓ Seeded ${seedUsers.length} sample users and ${CAMPUSES.length} campuses.`);
  console.log(`✓ Total users in DB: ${total}`);
  console.log(`\nAll sample accounts use password: ${PASSWORD}`);
  console.log("Examples:");
  console.log("  superadmin1@nxtwave.co.in  (Super Admin)");
  console.log("  admin1@nxtwave.co.in       (Admin)");
  console.log("  hod1@nxtwave.co.in         (HOD)");
  console.log("  cm1@nxtwave.co.in          (Capability Manager)");
  console.log("  boa1@nxtwave.co.in         (BOA)");
  console.log("  instructor1@nxtwave.co.in  (Instructor)");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
