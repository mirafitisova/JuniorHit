import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, Redirect } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Users, TrendingUp, Calendar, Activity, MapPin, Trophy,
  ShieldAlert, ShieldCheck, ShieldOff, Loader2, Megaphone,
  ExternalLink, Search,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Analytics {
  users: { total: number; thisWeek: number; lastWeek: number };
  activeUsers: number;
  sessions: { total: number; thisWeek: number; lastWeek: number };
  sessionsThisWeek: number;
  avgSessionsPerUser: number;
  topCourts: { id: number; name: string; sessionCount: number }[];
  topPlayers: { id: string; name: string; sessionCount: number }[];
  funnel: {
    signedUp: number;
    emailVerified: number;
    active: number;
    profileCompleted: number;
    hadFirstSession: number;
  };
  avgDaysToFirstSession: number | null;
}

interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  account_status: string;
  is_admin: boolean;
  email_verified: boolean;
  created_at: string;
  zip_code: string | null;
  session_count: number;
  last_active: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function trend(current: number, previous: number) {
  const delta = current - previous;
  return delta >= 0 ? `+${delta}` : `${delta}`;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PENDING_EMAIL: "bg-yellow-100 text-yellow-700",
    PENDING_PARENT: "bg-orange-100 text-orange-700",
    SUSPENDED: "bg-red-100 text-red-700",
    FLAGGED: "bg-purple-100 text-purple-700",
  };
  return (
    <Badge className={`border-0 ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status.replace("_", " ")}
    </Badge>
  );
}

const CHART_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd"];

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  subColor = "text-slate-400",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
}) {
  return (
    <Card className="border-0 shadow-sm rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            {sub && <p className={`text-xs mt-1 ${subColor}`}>{sub}</p>}
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ data }: { data: Analytics }) {
  const { users, sessions, activeUsers, sessionsThisWeek, avgSessionsPerUser, funnel, avgDaysToFirstSession } = data;

  const funnelData = [
    { name: "Signed up", value: funnel.signedUp },
    { name: "Email verified", value: funnel.emailVerified },
    { name: "Active", value: funnel.active },
    { name: "Profile done", value: funnel.profileCompleted },
    { name: "First session", value: funnel.hadFirstSession },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={users.total.toLocaleString()}
          sub={`${trend(users.thisWeek, users.lastWeek)} vs last week (${users.thisWeek} this week)`}
          subColor={users.thisWeek >= users.lastWeek ? "text-green-600" : "text-red-500"}
        />
        <StatCard
          icon={Activity}
          label="Active Users (7d)"
          value={activeUsers.toLocaleString()}
          sub="Users with an active session"
        />
        <StatCard
          icon={Trophy}
          label="Total Sessions"
          value={sessions.total.toLocaleString()}
          sub={`${trend(sessions.thisWeek, sessions.lastWeek)} vs last week`}
          subColor={sessions.thisWeek >= sessions.lastWeek ? "text-green-600" : "text-red-500"}
        />
        <StatCard
          icon={Calendar}
          label="Sessions This Week"
          value={sessionsThisWeek.toLocaleString()}
          sub="Accepted + completed"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Sessions / User"
          value={avgSessionsPerUser}
          sub="Per active user this week"
        />
        <StatCard
          icon={MapPin}
          label="Avg Days to 1st Session"
          value={avgDaysToFirstSession != null ? `${avgDaysToFirstSession}d` : "—"}
          sub="From sign-up to first completed session"
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Top courts */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Courts by Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topCourts} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sessionCount" radius={[0, 4, 4, 0]}>
                  {data.topCourts.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top players */}
        <Card className="border-0 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Most Active Players (top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topPlayers} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="sessionCount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Funnel */}
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Sign-up Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((step, i) => {
              const pct = funnelData[0].value > 0
                ? Math.round((step.value / funnelData[0].value) * 100)
                : 0;
              const dropPct = i > 0 && funnelData[i - 1].value > 0
                ? Math.round(((funnelData[i - 1].value - step.value) / funnelData[i - 1].value) * 100)
                : null;
              return (
                <div key={step.name}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-700 font-medium">{step.name}</span>
                    <span className="text-slate-500">
                      {step.value.toLocaleString()} ({pct}%)
                      {dropPct !== null && dropPct > 0 && (
                        <span className="text-red-400 ml-2">−{dropPct}% drop</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CHART_COLORS[i],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Users Tab ─────────────────────────────────────────────────────────────────

function UsersTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users").then(r => r.json()),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, accountStatus }: { id: string; accountStatus: string }) =>
      apiRequest("PATCH", `/api/admin/users/${id}`, { accountStatus }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User updated" });
    },
    onError: () => toast({ title: "Failed to update user", variant: "destructive" }),
  });

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <Card className="border-0 shadow-sm rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Player</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => (
                  <TableRow key={u.id} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">
                          {[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}
                          {u.is_admin && (
                            <Badge className="ml-2 bg-blue-100 text-blue-700 border-0 text-xs">admin</Badge>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{statusBadge(u.account_status)}</TableCell>
                    <TableCell className="text-center font-medium">{u.session_count}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {u.last_active
                        ? formatDistanceToNow(new Date(u.last_active), { addSuffix: true })
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {u.created_at ? format(new Date(u.created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.account_status !== "FLAGGED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-7 px-2 text-purple-600 border-purple-200 hover:bg-purple-50"
                            onClick={() => updateStatus.mutate({ id: u.id, accountStatus: "FLAGGED" })}
                            disabled={updateStatus.isPending || u.is_admin}
                            title="Flag account"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {u.account_status !== "SUSPENDED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-7 px-2 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatus.mutate({ id: u.id, accountStatus: "SUSPENDED" })}
                            disabled={updateStatus.isPending || u.is_admin}
                            title="Suspend account"
                          >
                            <ShieldOff className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {(u.account_status === "SUSPENDED" || u.account_status === "FLAGGED") && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg h-7 px-2 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatus.mutate({ id: u.id, accountStatus: "ACTIVE" })}
                            disabled={updateStatus.isPending}
                            title="Activate account"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ── Broadcast Tab ─────────────────────────────────────────────────────────────

function BroadcastTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", body: "", areaFilter: "", scheduledAt: "" });

  const create = useMutation({
    mutationFn: (data: typeof form) =>
      apiRequest("POST", "/api/admin/broadcasts", {
        ...data,
        areaFilter: data.areaFilter.trim() || null,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/broadcasts"] });
      setForm({ title: "", body: "", areaFilter: "", scheduledAt: "" });
      toast({ title: "Broadcast scheduled" });
    },
    onError: () => toast({ title: "Failed to create broadcast", variant: "destructive" }),
  });

  return (
    <div className="max-w-lg space-y-4">
      <Card className="border-0 shadow-sm rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-primary" />
            Send Tournament Notification
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={e => { e.preventDefault(); create.mutate(form); }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <Label>Subject / Title</Label>
              <Input
                placeholder="SoCal Closed is in 3 weeks. Find a prep partner!"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Message</Label>
              <Textarea
                placeholder="The SoCal Closed is coming up. Find a prep partner on JuniorHit to get match-ready!"
                value={form.body}
                onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                required
                rows={4}
                className="rounded-xl resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>
                Area filter{" "}
                <span className="text-muted-foreground font-normal">(optional — blank = all users)</span>
              </Label>
              <Input
                placeholder="e.g. SoCal, Los Angeles"
                value={form.areaFilter}
                onChange={e => setForm(f => ({ ...f, areaFilter: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Send at</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                required
                className="rounded-xl"
              />
            </div>
            <Button type="submit" className="w-full rounded-xl" disabled={create.isPending}>
              {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule Broadcast"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/admin/notifications">
        <Button variant="outline" className="w-full rounded-xl gap-2">
          <ExternalLink className="w-4 h-4" />
          Manage all broadcasts
        </Button>
      </Link>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();

  if (!user) return <Redirect to="/" />;
  if (!user.isAdmin) return <Redirect to="/" />;

  const { data: analytics, isLoading, error } = useQuery<Analytics>({
    queryKey: ["/api/admin/analytics"],
    queryFn: () => apiRequest("GET", "/api/admin/analytics").then(r => r.json()),
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation />
      <div className="md:pl-64 pb-20">
        {/* Header */}
        <div className="bg-white border-b px-4 py-4 sticky top-16 md:top-0 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-xs text-slate-400">CourtMatch platform overview</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/courts">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Manage Courts
                </Button>
              </Link>
              <Link href="/admin/notifications">
                <Button variant="outline" size="sm" className="rounded-xl gap-1.5">
                  <Megaphone className="w-3.5 h-3.5" /> Broadcasts
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          <Tabs defaultValue="overview">
            <TabsList className="mb-6 rounded-xl bg-slate-100">
              <TabsTrigger value="overview" className="rounded-lg">Overview</TabsTrigger>
              <TabsTrigger value="users" className="rounded-lg">Users</TabsTrigger>
              <TabsTrigger value="broadcast" className="rounded-lg">Broadcast</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              {isLoading && (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              {error && (
                <div className="text-center py-16 text-slate-400">
                  Failed to load analytics. Are you connected to the database?
                </div>
              )}
              {analytics && <OverviewTab data={analytics} />}
            </TabsContent>

            <TabsContent value="users">
              <UsersTab />
            </TabsContent>

            <TabsContent value="broadcast">
              <BroadcastTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
