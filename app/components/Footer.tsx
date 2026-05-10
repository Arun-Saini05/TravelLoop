import Link from "next/link";
import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer} id="footer">
      <div className={styles.container}>
        <div className={styles.top}>
          {/* Brand */}
          <div className={styles.brand}>
            <Link href="/" className={styles.logo}>
              <svg
                className={styles.logoIcon}
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="16" cy="16" r="14" fill="url(#footerLogoGrad)" />
                <path
                  d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M8 16H24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M16 8V24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <ellipse cx="16" cy="16" rx="4" ry="8" stroke="white" strokeWidth="1.5" />
                <defs>
                  <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#0f766e" />
                    <stop offset="1" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
              </svg>
              <span className={styles.logoText}>Traveloop</span>
            </Link>
            <p className={styles.tagline}>
              Dream, design, and organize your perfect trip — all in one place.
            </p>
          </div>

          {/* Links */}
          <div className={styles.linksGroup}>
            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Product</h4>
              <a href="#features" className={styles.link}>Features</a>
              <a href="#destinations" className={styles.link}>Destinations</a>
              <a href="#how-it-works" className={styles.link}>How It Works</a>
            </div>
            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Company</h4>
              <a href="#" className={styles.link}>About Us</a>
              <a href="#" className={styles.link}>Blog</a>
              <a href="#" className={styles.link}>Careers</a>
            </div>
            <div className={styles.linkColumn}>
              <h4 className={styles.linkTitle}>Support</h4>
              <a href="#" className={styles.link}>Help Center</a>
              <a href="#" className={styles.link}>Privacy Policy</a>
              <a href="#" className={styles.link}>Terms of Service</a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {new Date().getFullYear()} Traveloop. Made with ❤️ for travelers everywhere.
          </p>
        </div>
      </div>
    </footer>
  );
}
