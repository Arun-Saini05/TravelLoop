import styles from "./HowItWorks.module.css";

const steps = [
  {
    number: "01",
    title: "Dream & Discover",
    description:
      "Browse trending destinations, search cities by budget and popularity, and save your favorites to your wishlist.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Build Your Itinerary",
    description:
      "Add stops, assign dates, pick activities, and organize your day-by-day plan with our drag-and-drop builder.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Share & Collaborate",
    description:
      "Invite friends, share your plan with a link, or let others copy your itinerary and make it their own.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Travel with Confidence",
    description:
      "Hit the road with your budget tracked, checklist packed, notes ready, and your entire journey at your fingertips.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works">
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.label}>HOW IT WORKS</span>
          <h2 className={styles.heading}>
            From idea to adventure in{" "}
            <span className={styles.accent}>4 simple steps</span>
          </h2>
          <p className={styles.subtitle}>
            Planning your dream trip has never been easier. Here&apos;s how Traveloop
            guides you every step of the way.
          </p>
        </div>

        {/* Steps */}
        <div className={styles.steps}>
          {steps.map((step, i) => (
            <div key={i} className={styles.step} id={`step-${i}`}>
              <div className={styles.stepIcon}>
                {step.icon}
                <span className={styles.stepNumber}>{step.number}</span>
              </div>
              {i < steps.length - 1 && <div className={styles.connector} />}
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDesc}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
