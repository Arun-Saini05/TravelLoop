import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <nav className={styles.navbar} id="navbar">
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo} id="navbar-logo">
          <svg
            className={styles.logoIcon}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="16" cy="16" r="14" fill="url(#logoGrad)" />
            <path
              d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M8 16H24"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M16 8V24"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <ellipse
              cx="16"
              cy="16"
              rx="4"
              ry="8"
              stroke="white"
              strokeWidth="1.5"
            />
            <defs>
              <linearGradient
                id="logoGrad"
                x1="0"
                y1="0"
                x2="32"
                y2="32"
              >
                <stop stopColor="#0f766e" />
                <stop offset="1" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Traveloop</span>
        </Link>

        {/* Navigation Links */}
        <div className={styles.navLinks}>
          <a href="#destinations" className={styles.navLink}>
            Destinations
          </a>
          <a href="#features" className={styles.navLink}>
            Features
          </a>
          <a href="#how-it-works" className={styles.navLink}>
            How It Works
          </a>
        </div>

        {/* Login / Sign Up Button */}
        <Link href="/login" className={styles.authButton} id="login-signup-btn">
          Login / Sign Up
        </Link>
      </div>
    </nav>
  );
}
