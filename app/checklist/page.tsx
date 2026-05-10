import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import ChecklistClient from "./ChecklistClient";

export default async function ChecklistPage() {
  const session = await requireSession();

  // Fetch actual trips from the database for the logged-in user
  const trips = await db.trip.findMany({
    where: { ownerId: session.userId },
    select: { id: true, name: true },
    orderBy: { createdAt: "desc" },
  });

  return <ChecklistClient trips={trips} />;
}
