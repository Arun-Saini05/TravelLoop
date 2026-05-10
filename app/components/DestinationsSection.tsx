import Image from "next/image";
import { prisma } from "../lib/prisma";
import styles from "./DestinationsSection.module.css";

/* ── Country-to-image mapping ────────────────────────── */
/* We match seeded country codes to the hero images we have */
const countryImages: Record<string, { image: string; tagline: string }> = {
  JP: { image: "/images/dest-kyoto.png", tagline: "Where tradition meets tranquility" },
  CH: { image: "/images/dest-swiss-alps.png", tagline: "Majestic peaks & pristine lakes" },
  ID: { image: "/images/dest-bali.png", tagline: "Tropical paradise awaits" },
  FR: { image: "/images/dest-paris.png", tagline: "The city of lights & love" },
  MV: { image: "/images/dest-maldives.png", tagline: "Crystal waters & luxury" },
};

/* Cost tier from costMultiplier */
function costTier(multiplier: number | null): string {
  if (!multiplier) return "$";
  if (multiplier < 0.3) return "$";
  if (multiplier < 0.7) return "$$";
  if (multiplier < 1.2) return "$$$";
  return "$$$$";
}

/* Fallback static data in case DB is unavailable */
const fallbackDestinations = [
  { name: "Japan", code: "JP", costMultiplier: 0.52, gdpPerCapita: 33815 },
  { name: "Switzerland", code: "CH", costMultiplier: 1.4, gdpPerCapita: 91932 },
  { name: "Indonesia", code: "ID", costMultiplier: 0.07, gdpPerCapita: 4788 },
  { name: "France", code: "FR", costMultiplier: 0.66, gdpPerCapita: 42849 },
  { name: "Maldives", code: "MV", costMultiplier: 0.22, gdpPerCapita: 14074 },
];

export default async function DestinationsSection() {
  let destinations: {
    name: string;
    code: string;
    costMultiplier: number | null;
    gdpPerCapita: number | null;
  }[];

  try {
    const featuredCodes = Object.keys(countryImages);
    const countries = await prisma.country.findMany({
      where: { code: { in: featuredCodes } },
      select: {
        code: true,
        name: true,
        costMultiplier: true,
        gdpPerCapita: true,
      },
    });

    // Ensure we keep our display order
    destinations = featuredCodes
      .map((code) => countries.find((c) => c.code === code))
      .filter(Boolean) as typeof destinations;

    // If DB returned nothing (seed not run yet), use fallback
    if (destinations.length === 0) {
      destinations = fallbackDestinations;
    }
  } catch {
    // DB connection failed — use fallback data
    destinations = fallbackDestinations;
  }

  return (
    <section className={styles.section} id="destinations">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.label}>POPULAR DESTINATIONS</span>
          <h2 className={styles.heading}>
            Discover your next{" "}
            <span className={styles.accent}>adventure</span>
          </h2>
          <p className={styles.subtitle}>
            Real-world data from {destinations.length} countries — explore
            destinations with live cost indices powered by World Bank GDP data.
          </p>
        </div>

        {/* Cards Grid */}
        <div className={styles.grid}>
          {destinations.map((dest, i) => {
            const meta = countryImages[dest.code] ?? {
              image: "/images/dest-kyoto.png",
              tagline: "Explore this destination",
            };
            const cost = costTier(dest.costMultiplier);
            const gdpFormatted = dest.gdpPerCapita
              ? `$${Math.round(dest.gdpPerCapita).toLocaleString()}`
              : "N/A";

            return (
              <div
                key={dest.code}
                className={`${styles.card} ${i === 0 ? styles.cardLarge : ""}`}
                id={`dest-card-${dest.code}`}
              >
                <div className={styles.cardImage}>
                  <Image
                    src={meta.image}
                    alt={`${dest.name} — popular travel destination`}
                    fill
                    sizes={
                      i === 0
                        ? "(max-width: 768px) 100vw, 50vw"
                        : "(max-width: 768px) 100vw, 25vw"
                    }
                    style={{ objectFit: "cover" }}
                  />
                  <div className={styles.cardOverlay} />
                </div>

                <div className={styles.cardContent}>
                  <div className={styles.cardBadges}>
                    <span className={styles.costBadge}>{cost}</span>
                    <span className={styles.gdpBadge}>
                      GDP {gdpFormatted}
                    </span>
                  </div>
                  <h3 className={styles.cardTitle}>{dest.name}</h3>
                  <p className={styles.cardTagline}>{meta.tagline}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
