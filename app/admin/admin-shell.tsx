"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ──────────────────────────────────────────────────────────────────
type AdminData = {
  stats: { totalUsers: number; totalTrips: number; totalActivities: number; totalCities: number };
  tripsPerMonth: { month: string; count: number }[];
  userGrowth: { month: string; count: number }[];
  statusMap: Record<string, number>;
  typeMap: Record<string, number>;
  topCities: { name: string; countryCode: string; count: number }[];
  topActivities: { name: string; type: string; count: number }[];
  recentUsers: { id: string; username: string; email: string; firstName: string | null; lastName: string | null; role: string; isActive: boolean; createdAt: string }[];
  recentTrips: { id: string; name: string; status: string; visibility: string; createdAt: string; owner: { username: string }; _count: { stops: number } }[];
};

// ── Icons ─────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const TripsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="M4 12V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8"/></svg>
);

const CitiesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
);

const ActivitiesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);

// ── Mini sparkline SVG ─────────────────────────────────────────────────────
function Sparkline({ data, color = "#0f766e" }: { data: number[]; color?: string }) {
  if (data.length < 2) return <div className="h-12 flex items-end text-xs text-slate-400">No data available</div>;
  const max = Math.max(...data, 1);
  const w = 600, h = 120;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  const fillPts = `0,${h} ${pts} ${w},${h}`;
  
  return (
    <div className="relative w-full h-[140px] flex items-center justify-center group">
      <svg width="100%" height={h} viewBox={`0 -10 ${w} ${h + 20}`} className="overflow-visible w-full">
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polyline points={fillPts} fill={`url(#gradient-${color})`} />
        <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" className="drop-shadow-sm" />
        {data.map((v, i) => (
          <circle key={i} cx={(i / (data.length - 1)) * w} cy={h - (v / max) * h} r="4" fill="#ffffff" stroke={color} strokeWidth="2" 
            className="transition-all duration-300 group-hover:r-[6px]" />
        ))}
      </svg>
    </div>
  );
}

// ── Bar chart ─────────────────────────────────────────────────────────────
function BarChart({ items, color = "#0f766e" }: { items: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-4 w-full">
      {items.map((item, idx) => (
        <div key={item.label} className="flex items-center gap-4 text-sm group">
          <span className="w-28 truncate text-right text-slate-600 font-medium transition-colors group-hover:text-slate-900">{item.label}</span>
          <div className="flex-1 rounded-full bg-slate-100 h-3 overflow-hidden shadow-inner relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / max) * 100}%` }}
              transition={{ duration: 0.8, delay: idx * 0.1, ease: "easeOut" }}
              className="h-full rounded-full absolute left-0 top-0" 
              style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }} 
            />
          </div>
          <span className="w-8 text-slate-700 font-semibold tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Donut chart (SVG) ─────────────────────────────────────────────────────
const DONUT_COLORS = ["#14b8a6", "#3b82f6", "#8b5cf6", "#f43f5e", "#f59e0b", "#0ea5e9"];
function DonutChart({ slices }: { slices: { label: string; value: number }[] }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let angle = 0;
  const r = 36, cx = 50, cy = 50, stroke = 18;
  const circumference = 2 * Math.PI * r;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 justify-center">
      <div className="relative">
        <svg width="160" height="160" viewBox="0 0 100 100" className="drop-shadow-sm filter">
          {slices.map((s, i) => {
            const pct = s.value / total;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const rot = angle;
            angle += pct * 360;
            return (
              <circle key={s.label} cx={cx} cy={cy} r={r}
                fill="none" stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
                strokeWidth={stroke} strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-rot * (circumference / 360) + circumference / 4}
                style={{ transform: `rotate(-90deg)`, transformOrigin: "50% 50%", transition: "all 1s cubic-bezier(0.4, 0, 0.2, 1)" }}
                className="hover:opacity-80 cursor-pointer" />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
          <span className="text-2xl font-bold text-slate-800">{total}</span>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total</span>
        </div>
      </div>
      
      <ul className="space-y-3">
        {slices.slice(0, 5).map((s, i) => (
          <li key={s.label} className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 rounded-full shadow-sm" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="text-slate-600 font-medium w-24 truncate">{s.label}</span>
            <span className="text-slate-900 font-bold tabular-nums ml-2">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Main admin shell ───────────────────────────────────────────────────────
export function AdminShell({ data, currentUserId }: { data: AdminData; currentUserId: string }) {
  const [tab, setTab] = useState<"overview" | "users" | "cities" | "activities">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  
  // User CRUD states
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminData["recentUsers"][0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const tabs = [
    { key: "overview", label: "Overview & Analytics" },
    { key: "users", label: "Manage Users" },
    { key: "cities", label: "Popular Cities" },
    { key: "activities", label: "Popular Activities" },
  ] as const;

  const typeSlices = Object.entries(data.typeMap).map(([k, v]) => ({ label: k, value: v })).sort((a, b) => b.value - a.value);

  const filteredUsers = data.recentUsers.filter(
    (u) => u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
           u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
           (u.firstName && u.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
           (u.lastName && u.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateOrUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    const fd = new FormData(e.currentTarget);
    const role = fd.get("role") as string;
    const isActive = fd.get("isActive") === "true";
    const username = fd.get("username") as string;
    const email = fd.get("email") as string;
    const firstName = fd.get("firstName") as string;
    const lastName = fd.get("lastName") as string;

    try {
      const { adminCreateUser, adminUpdateUser } = await import("@/actions/admin");
      if (editingUser) {
        await adminUpdateUser(editingUser.id, { role: role as "USER" | "ADMIN", isActive, username, email, firstName, lastName });
      } else {
        await adminCreateUser({ role: role as "USER" | "ADMIN", username, email, firstName, lastName, passwordHash: "dummy" });
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleBan = async (user: AdminData["recentUsers"][0]) => {
    try {
      const { adminUpdateUser } = await import("@/actions/admin");
      await adminUpdateUser(user.id, { isActive: !user.isActive });
    } catch (err: any) {
      alert("Failed to update user status: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-teal-500/30">
      
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <Link href="/dashboard" className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 group">
          <svg
            className="w-7 h-7"
            viewBox='0 0 32 32'
            fill='none'
            xmlns='http://www.w3.org/2000/svg'
          >
            <circle cx='16' cy='16' r='14' fill='url(#dashLogoGrad)' />
            <path d='M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16' stroke='white' strokeWidth='2' strokeLinecap='round' />
            <path d='M8 16H24' stroke='white' strokeWidth='1.5' strokeLinecap='round' />
            <path d='M16 8V24' stroke='white' strokeWidth='1.5' strokeLinecap='round' />
            <ellipse cx='16' cy='16' rx='4' ry='8' stroke='white' strokeWidth='1.5' />
            <defs>
              <linearGradient id='dashLogoGrad' x1='0' y1='0' x2='32' y2='32'>
                <stop stopColor='#14b8a6' />
                <stop offset='1' stopColor='#06b6d4' />
              </linearGradient>
            </defs>
          </svg>
          Traveloop
          <span className="ml-2 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200">Admin</span>
        </Link>
        <Link href="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white shadow-sm border border-teal-600 hover:ring-2 ring-teal-500/20 transition-all">
          U
        </Link>
      </header>

      <main className="flex-1 flex flex-col px-4 sm:px-8 py-8 gap-8 max-w-[1200px] w-full mx-auto">
        
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1 max-w-md group">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
              <SearchIcon />
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <button className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              Group by
            </button>
            <button className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
              <FilterIcon /> Filter
            </button>
            <button className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-sm">
              Sort by...
            </button>
          </div>
        </div>

        {/* Tabs Row */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative h-10 rounded-xl px-5 text-sm font-semibold transition-all duration-300 ${
                tab === t.key 
                  ? "text-teal-800 shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
              }`}
            >
              {tab === t.key && (
                <motion.div layoutId="active-tab" className="absolute inset-0 bg-white border border-slate-200 rounded-xl" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Main Content Area ── */}
        <div className="flex-1 flex flex-col relative min-h-[600px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              
              {/* ── OVERVIEW (KPIs & Analytics) ── */}
              {tab === "overview" && (
                <div className="flex-1 flex flex-col gap-8">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <UsersIcon />
                        <span className="font-semibold text-sm">Total Users</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">{data.stats.totalUsers}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <TripsIcon />
                        <span className="font-semibold text-sm">Total Trips</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">{data.stats.totalTrips}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ActivitiesIcon />
                        <span className="font-semibold text-sm">Total Activities</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">{data.stats.totalActivities}</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <CitiesIcon />
                        <span className="font-semibold text-sm">Cities Explored</span>
                      </div>
                      <div className="text-3xl font-bold text-slate-900">{data.stats.totalCities}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Donut Chart */}
                    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Activities Breakdown</h3>
                      <div className="flex-1 flex items-center justify-center">
                        <DonutChart slices={typeSlices.length > 0 ? typeSlices : [{ label: "Activities", value: 100 }]} />
                      </div>
                    </div>

                    {/* Right: Top Cities Bar Chart */}
                    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-500 mb-6 uppercase tracking-wider">Top Destinations</h3>
                      <div className="flex-1 flex flex-col justify-center">
                        <BarChart items={data.topCities.slice(0, 5).map((c) => ({ label: c.name, value: c.count }))} color="#14b8a6" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Sparkline Trend */}
                  <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 flex flex-col flex-1 min-h-[250px]">
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">User Growth Trend</h3>
                      <span className="text-xs text-slate-400 font-medium">Last 6 Months</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                      <Sparkline data={data.userGrowth.map(g => g.count)} color="#0ea5e9" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── MANAGE USERS ── */}
              {tab === "users" && (
                <div className="space-y-6 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">Manage Users</h2>
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600 border border-slate-200">{data.stats.totalUsers} total</span>
                    </div>
                    <button 
                      onClick={() => { setEditingUser(null); setIsUserModalOpen(true); }}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                    >
                      + Create User
                    </button>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-200">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">User</th>
                          <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Email</th>
                          <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Role</th>
                          <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                          <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredUsers.length === 0 ? (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500 italic">No users found.</td></tr>
                        ) : (
                          filteredUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shadow-inner border ${u.isActive ? "bg-teal-100 text-teal-700 border-teal-200" : "bg-red-100 text-red-700 border-red-200"}`}>
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-slate-800">@{u.username}</span>
                                    {(u.firstName || u.lastName) && (
                                      <span className="text-xs text-slate-500">{u.firstName} {u.lastName}</span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-slate-500">{u.email}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                                  u.role === "ADMIN" 
                                    ? "bg-teal-50 text-teal-700 border-teal-200" 
                                    : "bg-slate-50 text-slate-500 border-slate-200"
                                }`}>{u.role}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${
                                  u.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                                }`}>
                                  {u.isActive ? "Active" : "Banned"}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  <button 
                                    onClick={() => { setEditingUser(u); setIsUserModalOpen(true); }}
                                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-md border border-slate-200 hover:border-teal-200 transition-all"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleToggleBan(u)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                                      u.isActive 
                                        ? "text-red-600 hover:bg-red-50 border-slate-200 hover:border-red-200" 
                                        : "text-green-600 hover:bg-green-50 border-slate-200 hover:border-green-200"
                                    }`}
                                  >
                                    {u.isActive ? "Ban" : "Unban"}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── POPULAR CITIES ── */}
              {tab === "cities" && (
                <div className="space-y-6 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col h-full">
                  <h2 className="text-2xl font-bold text-slate-900">Popular Cities</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {data.topCities.map((c, i) => (
                      <div key={c.name} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex items-center gap-4 hover:border-teal-200 hover:shadow-md transition-all group cursor-default">
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg font-bold text-slate-400 shadow-sm group-hover:text-teal-600 transition-colors">
                          {i + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 text-lg group-hover:text-teal-700 transition-colors">{c.name}</div>
                          <div className="text-slate-500 text-sm mt-0.5 font-medium">{c.countryCode} &middot; {c.count} stop{c.count !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── POPULAR ACTIVITIES ── */}
              {tab === "activities" && (
                <div className="space-y-6 bg-white border border-slate-200 shadow-sm rounded-3xl p-6 sm:p-8 flex flex-col h-full">
                  <h2 className="text-2xl font-bold text-slate-900">Popular Activities</h2>
                  <div className="max-w-3xl rounded-2xl border border-slate-100 bg-slate-50 p-8 shadow-inner">
                    <BarChart items={data.topActivities.slice(0, 10).map((a) => ({ label: a.name, value: a.count }))} color="#0ea5e9" />
                  </div>
                </div>
              )}
              
            </motion.div>
          </AnimatePresence>
        </div>
        
      </main>

      {/* User CRUD Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingUser ? "Edit User" : "Create New User"}
                </h3>
                <button 
                  onClick={() => setIsUserModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <form onSubmit={handleCreateOrUpdateUser} className="p-6 flex flex-col gap-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                    {errorMsg}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">First Name</label>
                    <input name="firstName" defaultValue={editingUser?.firstName || ""} className="h-10 px-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm shadow-sm" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Last Name</label>
                    <input name="lastName" defaultValue={editingUser?.lastName || ""} className="h-10 px-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm shadow-sm" />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Username <span className="text-red-500">*</span></label>
                  <input required name="username" defaultValue={editingUser?.username || ""} className="h-10 px-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm shadow-sm" />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                  <input required type="email" name="email" defaultValue={editingUser?.email || ""} className="h-10 px-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm shadow-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Role</label>
                    <select name="role" defaultValue={editingUser?.role || "USER"} className="h-10 px-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm shadow-sm bg-white">
                      <option value="USER">User</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-semibold text-slate-700">Status</label>
                    <select name="isActive" defaultValue={editingUser ? (editingUser.isActive ? "true" : "false") : "true"} className="h-10 px-3 rounded-lg border border-slate-200 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-sm shadow-sm bg-white">
                      <option value="true">Active</option>
                      <option value="false">Banned</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    Cancel
                  </button>
                  <button disabled={isSubmitting} type="submit" className="px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors disabled:opacity-50">
                    {isSubmitting ? "Saving..." : "Save User"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
