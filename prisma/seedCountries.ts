import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Please define it in .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const USA_GDP_BASELINE = 65000;

interface WorldBankIndicator {
  country: { id: string; value: string };
  value: number | null;
  date: string;
}

interface WorldBankMeta {
  page: number;
  pages: number;
  per_page: number;
  total: number;
}

function isWorldBankMeta(value: unknown): value is WorldBankMeta {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.page === "number" &&
    typeof v.pages === "number" &&
    typeof v.per_page === "number" &&
    typeof v.total === "number"
  );
}

async function fetchGDPData(): Promise<WorldBankIndicator[]> {
  const allData: WorldBankIndicator[] = [];
  let page = 1;
  let totalPages = 1;

  console.log("Fetching GDP data from World Bank API...");

  while (page <= totalPages) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/NY.GDP.PCAP.CD?format=json&per_page=100&mrv=1&page=${page}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`World Bank API error: ${res.status} ${res.statusText}`);
    }

    const responseText = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(responseText);
    } catch {
      throw new Error(
        `World Bank API returned non-JSON on page ${page}: ${responseText.slice(0, 200)}`
      );
    }

    if (
      Array.isArray(json) &&
      json.length === 1 &&
      typeof json[0] === "object" &&
      json[0] !== null &&
      "message" in json[0]
    ) {
      throw new Error(
        `World Bank API error payload on page ${page}: ${JSON.stringify(json[0])}`
      );
    }

    if (!Array.isArray(json) || json.length < 2) {
      throw new Error(
        `Unexpected response shape on page ${page}. Expected [meta, data].`
      );
    }

    const meta = json[0];
    const data = json[1];

    if (!isWorldBankMeta(meta)) {
      throw new Error(`Invalid metadata shape on page ${page}.`);
    }

    const rows: WorldBankIndicator[] = Array.isArray(data)
      ? (data as WorldBankIndicator[])
      : [];

    totalPages = meta.pages;
    allData.push(...rows);

    console.log(`Page ${page}/${totalPages} fetched (${rows.length} records)`);
    page += 1;

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  return allData;
}

async function seedCountries() {
  try {
    const rawData = await fetchGDPData();

    const validData = rawData.filter(
      (entry) =>
        entry.value !== null &&
        entry.value > 0 &&
        entry.country?.id &&
        entry.country?.value
    );

    console.log(
      `Processing ${validData.length} countries with valid GDP data...`
    );

    let seeded = 0;
    let skipped = 0;

    for (const entry of validData) {
      const code = entry.country.id;
      const name = entry.country.value;
      const gdp = entry.value as number;
      const multiplier = gdp / USA_GDP_BASELINE;

      if (!/^[A-Z]{2,3}$/.test(code)) {
        skipped += 1;
        continue;
      }

      // Ignore known aggregate groups when using country/all.
      if (
        name.includes("income") ||
        name.includes("IDA") ||
        name.includes("IBRD") ||
        name.includes("World") ||
        name.includes("Euro area") ||
        name.includes("European Union") ||
        name.includes("Sub-Saharan") ||
        name.includes("Middle East") ||
        name.includes("North America") ||
        name.includes("East Asia") ||
        name.includes("South Asia") ||
        name.includes("Latin America") ||
        name.includes("Caribbean")
      ) {
        skipped += 1;
        continue;
      }

      await prisma.country.upsert({
        where: { code },
        update: {
          name,
          gdpPerCapita: gdp,
          costMultiplier: multiplier,
          lastUpdated: new Date(),
        },
        create: {
          code,
          name,
          gdpPerCapita: gdp,
          costMultiplier: multiplier,
        },
      });

      seeded += 1;
    }

    console.log("Done");
    console.log(`Seeded:  ${seeded} countries`);
    console.log(`Skipped: ${skipped} non-country aggregates`);

    const samples = await prisma.country.findMany({
      where: { code: { in: ["US", "IN", "FR", "TH", "CH", "AE", "JP"] } },
      select: {
        code: true,
        name: true,
        gdpPerCapita: true,
        costMultiplier: true,
      },
    });

    console.log("Sample multipliers:");
    for (const c of samples) {
      const gdp = Math.round(c.gdpPerCapita ?? 0).toLocaleString().padStart(8);
      const mult = c.costMultiplier?.toFixed(3) ?? "n/a";
      console.log(`${c.code} | ${c.name.padEnd(20)} | GDP: $${gdp} | ${mult}`);
    }
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCountries();
