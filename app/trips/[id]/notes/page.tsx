import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { NotesClient } from "./notes-client";
import { AppHeader, buttonClasses } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TripNotesPage({ params }: PageProps) {
  const session = await requireSession();
  const { id: tripId } = await params;

  const trip = await db.trip.findFirst({
    where: {
      id: tripId,
      members: { some: { userId: session.userId } },
    },
    select: {
      id: true,
      name: true,
      stops: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          title: true,
          city: { select: { name: true } },
        },
      },
      notes: {
        orderBy: [{ noteDate: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          content: true,
          noteDate: true,
          createdAt: true,
          stopId: true,
          authorId: true,
          author: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!trip) notFound();

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="narrow"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: trip.name, href: `/trips/${tripId}` },
          { label: "Notes" },
        ]}
        actions={
          <Link
            href={`/trips/${tripId}`}
            className={buttonClasses({ variant: "secondary", size: "sm" })}
          >
            ← Back
          </Link>
        }
      />

      <NotesClient
        tripId={trip.id}
        tripName={trip.name}
        currentUserId={session.userId}
        stops={trip.stops.map((s) => ({
          id: s.id,
          label: s.title ?? s.city.name,
        }))}
        notes={trip.notes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          noteDate: n.noteDate ? n.noteDate.toISOString() : null,
          createdAt: n.createdAt.toISOString(),
          stopId: n.stopId,
          authorId: n.authorId,
          authorName:
            [n.author.firstName, n.author.lastName].filter(Boolean).join(" ") ||
            "Trip member",
        }))}
      />
    </main>
  );
}
