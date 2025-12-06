import * as fs from "fs";
import * as path from "path";
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

  // Read CSV file
  const csvPath = path.join(__dirname, "diem_thi_thpt_2024.csv");
  
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Split lines and skip header
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
  const header = lines[0];
  const dataLines = lines.slice(1);

  console.log(`[Seed] Reading ${dataLines.length} records from CSV file...`);

  // Parse data from CSV
  const records: ICreateBangDiem[] = dataLines.map((line) => {
    const values = line.split(",");
    return {
      sbd: values[0].trim(),
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
  });

  // Delete old records (if any)
  console.log("[Seed] Deleting existing records...");
  const deletedCount = await repository.deleteAll();
  console.log(`[Seed] Deleted ${deletedCount} existing records`);

  // Insert data in batches for better performance
  const batchSize = 1000;
  let insertedCount = 0;

  console.log(`[Seed] Inserting ${records.length} records in batches of ${batchSize}...`);

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const count = await repository.createMany(batch);
    insertedCount += count;
    
    const progress = Math.round((insertedCount / records.length) * 100);
    console.log(`[Seed] Progress: ${insertedCount}/${records.length} (${progress}%)`);
  }

  console.log(`[Seed] ✓ Seeding completed successfully!`);
  console.log(`[Seed] Total records inserted: ${insertedCount}`);
}

main()
  .catch((e) => {
    console.error("[Seed] ✗ Error seeding data:", e);
    process.exit(1);
  });

