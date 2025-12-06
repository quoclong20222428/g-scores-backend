import * as fs from "fs";
import * as path from "path";
import BangDiem, { ICreateBangDiem } from "../../src/model/BangDiem";

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

async function main() {
  console.log("Starting seed data...");

  // Read CSV file
  const csvPath = path.join(__dirname, "diem_thi_thpt_2024.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");

  // Split lines and skip header
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
  const header = lines[0];
  const dataLines = lines.slice(1);

  console.log("Reading " + dataLines.length + " records from CSV file...");

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
  console.log("Deleting old records...");
  const deletedCount = await BangDiem.deleteAll();
  console.log("Deleted " + deletedCount + " old records");

  // Insert data in batches for better performance
  const batchSize = 1000;
  let insertedCount = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const count = await BangDiem.createMany(batch);
    insertedCount += count;
    console.log("Inserted " + insertedCount + "/" + records.length + " records");
  }

  console.log("Seeding completed!");
}

main().catch((e) => {
  console.error("Error seeding data:", e);
  process.exit(1);
});
