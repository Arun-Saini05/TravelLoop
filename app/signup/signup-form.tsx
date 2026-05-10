"use client";

import { useActionState } from "react";
import { signup, type AuthActionState } from "@/app/actions/auth";
import { Button, Field, Input } from "@/components/ui";

const initialState: AuthActionState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="firstName" label="First name" required>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            placeholder="John"
          />
        </Field>

        <Field id="lastName" label="Last name">
          <Input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            placeholder="Doe"
          />
        </Field>
      </div>

      <Field id="username" label="Username" required>
        <Input
          id="username"
          name="username"
          type="text"
          required
          autoComplete="username"
          placeholder="johndoe"
        />
      </Field>

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
        helpText="Min 8 characters"
      >
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
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
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
