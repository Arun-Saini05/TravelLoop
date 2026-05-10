"use client";

import { useActionState } from "react";
import { signup, type AuthActionState } from "@/app/actions/auth";
import styles from "./signup-form.module.css";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="firstName" className={styles.label}>
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="John"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="lastName" className={styles.label}>
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="username" className={styles.label}>
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="johndoe"
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="email" className={styles.label}>
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password" className={styles.label}>
          Password
          <span className={styles.hint}>min 8 characters</span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          className={styles.input}
        />
      </div>

      {state.error ? (
        <div className={styles.error}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {state.error}
        </div>
      ) : null}

      <button type="submit" disabled={pending} className={styles.submitBtn}>
        {pending ? (
          <>
            <span className={styles.spinner} />
            Creating account...
          </>
        ) : (
          "Create account"
        )}
      </button>
    </form>
  );
}
