import Image from "next/image";
import Link from "next/link";
import styles from "./HeroSection.module.css";

export default function HeroSection() {
  return (
    <section className={styles.hero} id="hero">
      {/* Background Image */}
      <div className={styles.bgImage}>
        <Image
          src="/images/hero-santorini.png"
          alt="Santorini at golden hour — inspiring travel destination"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
          preload
        />
        <div className={styles.overlay} />
      </div>

      {/* Content */}
      <div className={styles.content}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Your journey starts here
        </div>

        <h1 className={styles.heading}>
          Dream it. <span className={styles.gradientText}>Plan it.</span>
          <br />
          Live it.
        </h1>

        <p className={styles.subtitle}>
          Build stunning itineraries, track your budget, discover hidden gems,
          and collaborate with friends — all in one beautiful platform.
        </p>

        <div className={styles.ctas}>
          <Link href="/login" className={styles.ctaPrimary} id="hero-get-started">
            Start Planning — It&apos;s Free
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 10H16M16 10L11 5M16 10L11 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a href="#how-it-works" className={styles.ctaSecondary} id="hero-learn-more">
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNumber}>10K+</span>
            <span className={styles.statLabel}>Trips Created</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>150+</span>
            <span className={styles.statLabel}>Countries</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statNumber}>25K+</span>
            <span className={styles.statLabel}>Happy Travelers</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={styles.scrollIndicator}>
        <div className={styles.scrollMouse}>
          <div className={styles.scrollWheel} />
        </div>
        <span className={styles.scrollText}>Scroll to explore</span>
      </div>
    </section>
  );
}
