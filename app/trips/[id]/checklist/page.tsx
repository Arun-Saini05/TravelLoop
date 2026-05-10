import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { ChecklistClient } from "./checklist-client";
import { AppHeader, buttonClasses } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ChecklistPage({ params }: PageProps) {
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
      checklistGroups: {
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          name: true,
          items: {
            orderBy: [{ isPacked: "asc" }, { sortOrder: "asc" }],
            select: {
              id: true,
              label: true,
              isPacked: true,
              packedAt: true,
            },
          },
        },
      },
    },
  });

  if (!trip) notFound();

  // Items not assigned to a category — surface them in an "Uncategorized"
  // bucket so they're still visible.
  const uncategorized = await db.checklistItem.findMany({
    where: { tripId, categoryId: null },
    orderBy: [{ isPacked: "asc" }, { sortOrder: "asc" }],
    select: {
      id: true,
      label: true,
      isPacked: true,
    },
  });

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="narrow"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: trip.name, href: `/trips/${tripId}` },
          { label: "Checklist" },
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

      <ChecklistClient
        tripId={trip.id}
        tripName={trip.name}
        categories={trip.checklistGroups.map((c) => ({
          id: c.id,
          name: c.name,
          items: c.items.map((i) => ({
            id: i.id,
            label: i.label,
            isPacked: i.isPacked,
          })),
        }))}
        uncategorized={uncategorized.map((i) => ({
          id: i.id,
          label: i.label,
          isPacked: i.isPacked,
        }))}
      />
    </main>
  );
}
