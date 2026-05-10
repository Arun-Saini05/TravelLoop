import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { ShareTripClient } from "./share-client";
import { AppHeader, buttonClasses } from "@/components/ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ShareTripPage({ params }: PageProps) {
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
      visibility: true,
      ownerId: true,
      shareLinks: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          isPublic: true,
          allowCopy: true,
          visitCount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!trip) notFound();

  const isOwner = trip.ownerId === session.userId;

  return (
    <main className="min-h-screen bg-app">
      <AppHeader
        width="narrow"
        crumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: trip.name, href: `/trips/${tripId}` },
          { label: "Share" },
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

      <ShareTripClient
        tripId={trip.id}
        tripName={trip.name}
        isOwner={isOwner}
        visibility={trip.visibility}
        shareLinks={trip.shareLinks.map((l) => ({
          id: l.id,
          slug: l.slug,
          isPublic: l.isPublic,
          allowCopy: l.allowCopy,
          visitCount: l.visitCount,
          createdAt: l.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
