import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";
import { ICreateBangDiem } from "../../src/model/BangDiem";
import BangDiemRepository from "../../src/repositories/BangDiemRepository";

const parseFloatValue = (value: string): number | null => {
  if (!value || value.trim() === "") {
    return null;
  }
  const parsed = Number.parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const parseString = (value: string): string | null => {
  if (!value || value.trim() === "") {
    return null;
  }
  return value.trim();
};

/**
 * Check if seed data should run
 * Returns true if:
 * 1. FORCE_SEED=true environment variable is set (force seed regardless)
 * 2. Database is empty (count = 0)
 * 
 * Returns false if:
 * 1. FORCE_SEED=false environment variable is set (explicitly skip)
 * 2. Database has data AND FORCE_SEED is not explicitly set
 */
async function shouldSeed(repository: BangDiemRepository): Promise<boolean> {
  const forceSeedEnv = process.env.FORCE_SEED;
  
  // Explicitly skip if FORCE_SEED=false
  if (forceSeedEnv === "false") {
    console.log("[Seed] FORCE_SEED=false - Skipping seed");
    return false;
  }
  
  // Force seed if FORCE_SEED=true
  if (forceSeedEnv === "true") {
    console.log("[Seed] FORCE_SEED=true - Proceeding with seed regardless of existing data");
    return true;
  }

  // Check existing data if FORCE_SEED is not set
  const existingCount = await repository.count();
  
  if (existingCount > 0) {
    console.log(`[Seed] Found ${existingCount} existing records. Skipping seed.`);
    console.log("[Seed] To force seed, set FORCE_SEED=true environment variable");
    return false;
  }

  console.log("[Seed] Database is empty. Proceeding with seed...");
  return true;
}

async function main() {
  console.log("[Seed] Starting seed data process...");

  const repository = new BangDiemRepository();

  // Check if we should seed
  const shouldRunSeed = await shouldSeed(repository);
  
  if (!shouldRunSeed) {
    console.log("[Seed] Seed skipped. Exiting.");
    return;
  }

  // Read CSV file using streaming to avoid memory issues
  const csvPath = path.join(__dirname, "diem_thi_thpt_2024.csv");
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  console.log("[Seed] Reading CSV file using streaming...");

  const fileStream = fs.createReadStream(csvPath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const batchSize = 500; // Process 2000 records at a time (optimized for low-memory environments like Render)
  let batch: ICreateBangDiem[] = [];
  let lineCount = 0;
  let insertedCount = 0;
  let totalRecords = 0;

  // Count total records first (quick scan)
  const countStream = fs.createReadStream(csvPath, { encoding: "utf-8" });
  const countRl = readline.createInterface({
    input: countStream,
    crlfDelay: Infinity,
  });

  for await (const line of countRl) {
    if (lineCount > 0) totalRecords++; // Skip header
    lineCount++;
  }
  lineCount = 0;

  console.log(`[Seed] CSV contains approximately ${totalRecords} records`);

  // Process lines
  for await (const line of rl) {
    // Skip empty lines and header
    if (!line.trim() || lineCount === 0) {
      lineCount++;
      continue;
    }

    const values = line.split(",");
    const record: ICreateBangDiem = {
      sbd: values[0]?.trim() || "",
      toan: parseFloatValue(values[1]),
      ngu_van: parseFloatValue(values[2]),
      ngoai_ngu: parseFloatValue(values[3]),
      vat_li: parseFloatValue(values[4]),
      hoa_hoc: parseFloatValue(values[5]),
      sinh_hoc: parseFloatValue(values[6]),
      lich_su: parseFloatValue(values[7]),
      dia_li: parseFloatValue(values[8]),
      gdcd: parseFloatValue(values[9]),
      ma_ngoai_ngu: parseString(values[10]),
    };

    batch.push(record);
    lineCount++;

    // Insert batch when size is reached
    if (batch.length >= batchSize) {
      const count = await repository.createMany(batch);
      insertedCount += count;
      const progress = Math.round((insertedCount / totalRecords) * 100);
      console.log(
        `[Seed] Progress: ${insertedCount}/${totalRecords} (${progress}%)`
      );
      batch = []; // Clear batch for next iteration
    }
  }

  // Insert remaining records
  if (batch.length > 0) {
    const count = await repository.createMany(batch);
    insertedCount += count;
    console.log(
      `[Seed] Progress: ${insertedCount}/${totalRecords} (100%)`
    );
  }

  console.log(`[Seed] ✓ Seeding completed successfully!`);
  console.log(`[Seed] Total records inserted: ${insertedCount}`);
}

main()
  .catch((e) => {
    console.error("[Seed] ✗ Error seeding data:", e);
    process.exit(1);
  });

