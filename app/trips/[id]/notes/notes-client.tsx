"use client";

import { useState, useTransition } from "react";
import { addTripNote, deleteTripNote } from "@/app/actions/notes";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  IconButton,
  Input,
  PageContainer,
  Select,
  Textarea,
} from "@/components/ui";

type StopOption = {
  id: string;
  label: string;
};

type Note = {
  id: string;
  title: string | null;
  content: string;
  noteDate: string | null;
  createdAt: string;
  stopId: string | null;
  authorId: string;
  authorName: string;
};

type Props = {
  tripId: string;
  tripName: string;
  currentUserId: string;
  stops: StopOption[];
  notes: Note[];
};

function fmt(value: string | null): string | null {
  if (!value) return null;
  try {
    return new Date(value).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

export function NotesClient({
  tripId,
  tripName,
  currentUserId,
  stops,
  notes: initialNotes,
}: Props) {
  const [notes, setNotes] = useState(initialNotes);

  const [open, setOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [draftStopId, setDraftStopId] = useState<string>("trip");
  const [draftDate, setDraftDate] = useState<string>("");

  const [error, setError] = useState<string | null>(null);
  const [pendingAdd, startAddTransition] = useTransition();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const stopMap = new Map(stops.map((s) => [s.id, s.label]));

  function handleAdd() {
    if (!draftContent.trim()) {
      setError("Write something before saving.");
      return;
    }
    setError(null);

    const fd = new FormData();
    fd.set("tripId", tripId);
    fd.set("title", draftTitle);
    fd.set("content", draftContent);
    fd.set("stopId", draftStopId);
    if (draftDate) fd.set("noteDate", draftDate);

    startAddTransition(async () => {
      const res = await addTripNote({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleDelete(note: Note) {
    if (!window.confirm("Delete this note?")) return;
    setError(null);
    setPendingDeleteId(note.id);
    const fd = new FormData();
    fd.set("noteId", note.id);
    startAddTransition(async () => {
      const res = await deleteTripNote({}, fd);
      setPendingDeleteId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      setNotes((prev) => prev.filter((n) => n.id !== note.id));
    });
  }

  return (
    <PageContainer width="narrow">
      <Card padded className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Trip notes &amp; journal
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              {tripName}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Hotel addresses, local tips, journal entries — all in one place.
            </p>
          </div>
          <Button
            type="button"
            variant={open ? "secondary" : "primary"}
            size="sm"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Cancel" : "+ New note"}
          </Button>
        </div>
      </Card>

      {open && (
        <Card padded className="mb-5">
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            New note
          </h2>
          <div className="mt-3 space-y-3">
            <Input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Title (optional)"
            />
            <Textarea
              value={draftContent}
              onChange={(e) => setDraftContent(e.target.value)}
              placeholder="Write your note…"
              rows={5}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Linked to">
                <Select
                  value={draftStopId}
                  size="sm"
                  onChange={(e) => setDraftStopId(e.target.value)}
                >
                  <option value="trip">Whole trip</option>
                  {stops.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date (optional)">
                <Input
                  type="date"
                  size="sm"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                />
              </Field>
            </div>
            {error && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleAdd}
                disabled={!draftContent.trim()}
                loading={pendingAdd}
              >
                {pendingAdd ? "Saving…" : "Save note"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!open && error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {notes.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No notes yet"
          description="Tap “+ New note” to capture something — a hotel confirmation, a tip from a friend, or a journal entry."
        />
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => {
            const stopLabel = note.stopId ? stopMap.get(note.stopId) : null;
            const dateLabel = fmt(note.noteDate ?? note.createdAt);
            const canDelete = note.authorId === currentUserId;
            return (
              <li key={note.id}>
                <Card padded interactive>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      {note.title && (
                        <h3 className="text-sm font-semibold tracking-tight text-zinc-900">
                          {note.title}
                        </h3>
                      )}
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-zinc-500">
                        {dateLabel && <span>{dateLabel}</span>}
                        {stopLabel && (
                          <>
                            <span className="text-zinc-300">·</span>
                            <Badge tone="brand" size="xs">
                              📍 {stopLabel}
                            </Badge>
                          </>
                        )}
                        <span className="text-zinc-300">·</span>
                        <span>by {note.authorName}</span>
                      </div>
                    </div>
                    {canDelete && (
                      <IconButton
                        aria-label="Delete note"
                        tone="danger"
                        size="sm"
                        onClick={() => handleDelete(note)}
                        disabled={pendingDeleteId === note.id}
                        title="Delete note"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </IconButton>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-zinc-700">
                    {note.content}
                  </p>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </PageContainer>
  );
}
