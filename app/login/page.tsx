import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/app/login/login-form";
import Image from "next/image";
import Link from "next/link";
import styles from "./login.module.css";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.page}>
      {/* Left: Image Panel */}
      <div className={styles.imagePanel}>
        <Image
          src="/images/hero-santorini.png"
          alt="Beautiful travel destination"
          fill
          sizes="50vw"
          style={{ objectFit: "cover" }}
        />
        <div className={styles.imageOverlay} />
        <div className={styles.imageContent}>
          <Link href="/" className={styles.logo}>
            <svg
              className={styles.logoIcon}
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="16" cy="16" r="14" fill="url(#loginLogoGrad)" />
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
                <linearGradient id="loginLogoGrad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>Traveloop</span>
          </Link>
          <blockquote className={styles.quote}>
            &ldquo;The world is a book, and those who do not travel read only one page.&rdquo;
          </blockquote>
          <p className={styles.quoteAuthor}>— Saint Augustine</p>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.heading}>Welcome back</h1>
            <p className={styles.subtitle}>
              Sign in to continue planning your next adventure.
            </p>
          </div>

          <LoginForm />

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <p className={styles.switchText}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className={styles.switchLink}>
              Create one for free
            </Link>
          </p>

          <Link href="/" className={styles.backLink}>
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
