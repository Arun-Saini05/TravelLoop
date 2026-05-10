import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AdminShell } from "./admin-shell";

export const metadata = {
  title: "Admin Dashboard — Traveloop",
  description: "Admin analytics and user management for Traveloop.",
};

// Build month buckets for the past 6 months
function last6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function bucketByMonth<T extends { createdAt: Date }>(items: T[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const key = `${item.createdAt.getFullYear()}-${String(item.createdAt.getMonth() + 1).padStart(2, "0")}`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export default async function AdminPage() {
  const session = await requireSession();
  if (session.role !== "ADMIN") redirect("/dashboard");

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalUsers,
    totalTrips,
    totalActivities,
    totalCities,
    recentUsers,
    tripsByStatus,
    activityByType,
    topCities,
    topActivities,
    recentTrips,
    recentTripsFull,
    recentUsersFull,
  ] = await Promise.all([
    db.user.count(),
    db.trip.count(),
    db.activity.count(),
    db.city.count(),

    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, username: true, email: true, firstName: true, lastName: true, role: true, isActive: true, createdAt: true },
    }),

    db.trip.groupBy({ by: ["status"], _count: { id: true } }),

    db.activity.groupBy({ by: ["type"], _count: { id: true } }),

    db.city.findMany({
      orderBy: { stops: { _count: "desc" } },
      take: 8,
      select: { name: true, countryCode: true, _count: { select: { stops: true } } },
    }),

    db.activity.findMany({
      orderBy: { assignments: { _count: "desc" } },
      take: 8,
      select: { name: true, type: true, _count: { select: { assignments: true } } },
    }),

    // For month bucketing — fetch all trips in the last 6 months
    db.trip.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),

    // Recent 10 trips for table
    db.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, status: true, visibility: true, createdAt: true,
        owner: { select: { username: true } },
        _count: { select: { stops: true } },
      },
    }),

    // All users in last 6 months for growth chart
    db.user.findMany({
      where: { createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true },
    }),
  ]);

  const months = last6Months();
  const tripBuckets = bucketByMonth(recentTrips);
  const userBuckets = bucketByMonth(recentUsersFull);

  const tripsPerMonth = months.map((m) => ({ month: m, count: tripBuckets[m] ?? 0 }));
  const userGrowth = months.map((m) => ({ month: m, count: userBuckets[m] ?? 0 }));

  const statusMap = Object.fromEntries(tripsByStatus.map((r) => [r.status, r._count.id]));
  const typeMap = Object.fromEntries(activityByType.map((r) => [r.type, r._count.id]));

  const data = {
    stats: { totalUsers, totalTrips, totalActivities, totalCities },
    tripsPerMonth,
    userGrowth,
    statusMap,
    typeMap,
    topCities: topCities.map((c) => ({ name: c.name, countryCode: c.countryCode, count: c._count.stops })),
    topActivities: topActivities.map((a) => ({ name: a.name, type: a.type, count: a._count.assignments })),
    recentUsers: recentUsers.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })),
    recentTrips: recentTripsFull.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() })),
  };

  return <AdminShell data={data} currentUserId={session.userId} />;
}
