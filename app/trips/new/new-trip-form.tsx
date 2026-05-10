"use client";

import { useActionState, useMemo, useState } from "react";
import { createTrip, type CreateTripActionState } from "@/app/actions/trips";
import { Button, Field, Input } from "@/components/ui";

const initialState: CreateTripActionState = {};

function todayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Local-date ISO (YYYY-MM-DD) so the calendar lines up with the user's tz.
  const tzOffsetMs = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export function NewTripForm() {
  const [state, formAction, pending] = useActionState(createTrip, initialState);
  const today = useMemo(() => todayIso(), []);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const endMin = startDate || today;
  // If the chosen end date drifts before the start date (because user changed
  // start later), clamp it visually so submit doesn't send an invalid range.
  const effectiveEnd = endDate && endDate < endMin ? "" : endDate;

  return (
    <form action={formAction} className="space-y-6">
      <Field id="tripName" label="Trip name" required>
        <Input
          id="tripName"
          name="tripName"
          type="text"
          required
          placeholder="Summer in Spain"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="startDate" label="Start date" required>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            required
            min={today}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>

        <Field
          id="endDate"
          label="End date"
          required
          helpText={!startDate ? "Pick a start date first." : undefined}
        >
          <Input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={endMin}
            value={effectiveEnd}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
      </div>

      {state.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        fullWidth
        loading={pending}
      >
        {pending ? "Saving trip…" : "Save trip & plan itinerary →"}
      </Button>
    </form>
  );
}
