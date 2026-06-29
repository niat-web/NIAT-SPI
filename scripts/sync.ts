import "./env";
import mongoose from "mongoose";
import { runSync } from "../lib/sync";

async function main() {
  console.log("Starting BigQuery → MongoDB attendance sync…");
  const r = await runSync();
  console.log(`✓ Synced ${r.students} students in ${(r.durationMs / 1000).toFixed(1)}s`);
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
