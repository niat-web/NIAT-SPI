import "./env";
import mongoose from "mongoose";
import { connectDB } from "../lib/mongodb";
import { StudentSnapshot } from "../models/StudentSnapshot";

function ms(s: number) { return `${s.toFixed(0)}ms`; }

async function main() {
  let t = Date.now();
  await connectDB();
  console.log("connect:", ms(Date.now() - t));

  t = Date.now();
  await StudentSnapshot.findOne({ studentUserId: "0a6a735c-b224-4842-9760-a022ac3b5bc6" }).lean();
  console.log("findOne (1 doc):", ms(Date.now() - t));

  t = Date.now();
  const all = await StudentSnapshot.find({}).select("studentUserId instituteName batchSectionName presentSessions totalSessions subjects").lean();
  console.log(`find ALL (${all.length} docs):`, ms(Date.now() - t));

  t = Date.now();
  await StudentSnapshot.findOne({ studentUserId: "0a6a735c-b224-4842-9760-a022ac3b5bc6" }).lean();
  console.log("findOne again (warm conn):", ms(Date.now() - t));

  // server location hint
  const admin = mongoose.connection.db ? await mongoose.connection.db.admin().command({ hello: 1 }).catch(() => null) : null;
  if (admin?.me) console.log("primary host:", admin.me);

  await mongoose.disconnect();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
