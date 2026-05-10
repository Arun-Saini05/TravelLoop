"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, type AuthActionState } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Field id="email" label="Email address" required>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
      </Field>

      <Field
        id="password"
        label="Password"
        required
        trailing={
          <Link
            href="#"
            className="font-medium text-teal-700 hover:text-teal-800"
            title="Coming soon"
          >
            Forgot password?
          </Link>
        }
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />
      </Field>

      {state.error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{state.error}</span>
        </div>
      ) : null}

      <Button
        type="submit"
        variant="brand"
        size="lg"
        fullWidth
        loading={pending}
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
