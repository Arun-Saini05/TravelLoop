import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { SignupForm } from "@/app/signup/signup-form";
import Image from "next/image";
import Link from "next/link";
import styles from "./signup.module.css";

export default async function SignupPage() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className={styles.page}>
      {/* Left: Image Panel */}
      <div className={styles.imagePanel}>
        <Image
          src="/images/dest-bali.png"
          alt="Bali — tropical travel destination"
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
              <circle cx="16" cy="16" r="14" fill="url(#signupLogoGrad)" />
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
                <linearGradient id="signupLogoGrad" x1="0" y1="0" x2="32" y2="32">
                  <stop stopColor="#14b8a6" />
                  <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <span className={styles.logoText}>Traveloop</span>
          </Link>
          <blockquote className={styles.quote}>
            &ldquo;Travel makes one modest. You see what a tiny place you occupy in the world.&rdquo;
          </blockquote>
          <p className={styles.quoteAuthor}>— Gustave Flaubert</p>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h1 className={styles.heading}>Create your account</h1>
            <p className={styles.subtitle}>
              Start building personalized trips with Traveloop — it&apos;s free.
            </p>
          </div>

          <SignupForm />

          <div className={styles.divider}>
            <span>or</span>
          </div>

          <p className={styles.switchText}>
            Already have an account?{" "}
            <Link href="/login" className={styles.switchLink}>
              Sign in
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
