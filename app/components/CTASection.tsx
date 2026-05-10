import Link from "next/link";
import styles from "./CTASection.module.css";

export default function CTASection() {
  return (
    <section className={styles.section} id="cta">
      <div className={styles.container}>
        <div className={styles.card}>
          {/* Background Pattern */}
          <div className={styles.pattern}>
            <div className={styles.circle1} />
            <div className={styles.circle2} />
            <div className={styles.circle3} />
          </div>

          <div className={styles.content}>
            <h2 className={styles.heading}>
              Ready to plan your <br />
              <span className={styles.accent}>dream adventure?</span>
            </h2>
            <p className={styles.subtitle}>
              Join thousands of travelers who plan smarter, spend less, and
              experience more with Traveloop.
            </p>
            <div className={styles.actions}>
              <Link href="/login" className={styles.ctaPrimary} id="cta-signup">
                Get Started for Free
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
            </div>
            <p className={styles.note}>No credit card required • Free forever</p>
          </div>
        </div>
      </div>
    </section>
  );
}
