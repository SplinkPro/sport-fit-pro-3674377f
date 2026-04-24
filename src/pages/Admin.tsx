import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Users, ShieldCheck, Clock, BarChart3, ChevronDown,
  Crown, Eye, UserCheck, BarChart2, Loader2, RefreshCw,
  LogOut, Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type AppRole = "admin" | "coach" | "analyst" | "viewer";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  full_name: string;
  avatar_url: string;
  provider: string;
  confirmed_at: string | null;
  roles: string;
}

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary",
  coach: "bg-info/10 text-info",
  analyst: "bg-warning/10 text-warning",
  viewer: "bg-muted text-muted-foreground",
};

const ROLE_ICONS: Record<AppRole, React.ReactNode> = {
  admin: <Crown className="w-3 h-3" />,
  coach: <UserCheck className="w-3 h-3" />,
  analyst: <BarChart2 className="w-3 h-3" />,
  viewer: <Eye className="w-3 h-3" />,
};

const ALL_ROLES: AppRole[] = ["admin", "coach", "analyst", "viewer"];

export default function Admin() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fetching, setFetching] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [openRoleDropdown, setOpenRoleDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/login");
    if (!loading && user && !isAdmin) navigate("/explorer");
  }, [loading, user, isAdmin, navigate]);

  const fetchUsers = async () => {
    setFetching(true);
    const { data, error } = await supabase.rpc("get_all_users_for_admin");
    if (error) toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    else setUsers((data as AdminUser[]) ?? []);
    setFetching(false);
  };

  useEffect(() => { if (isAdmin) fetchUsers(); }, [isAdmin]);

  const assignRole = async (targetUserId: string, newRole: AppRole) => {
    setUpdatingRole(targetUserId);
    setOpenRoleDropdown(null);
    // Remove existing roles for this user first
    await supabase.from("user_roles").delete().eq("user_id", targetUserId);
    const { error } = await supabase.from("user_roles").insert({
      user_id: targetUserId,
      role: newRole,
      assigned_by: user!.id,
    });
    if (error) toast({ title: "Failed to update role", description: error.message, variant: "destructive" });
    else { toast({ title: "Role updated", description: `User assigned as ${newRole}` }); fetchUsers(); }
    setUpdatingRole(null);
  };

  const stats = [
    { label: "Total Users", value: users.length, icon: <Users className="w-5 h-5" />, tone: "primary" },
    { label: "Admins", value: users.filter(u => u.roles?.includes("admin")).length, icon: <Crown className="w-5 h-5" />, tone: "primary" },
    { label: "Coaches", value: users.filter(u => u.roles?.includes("coach")).length, icon: <UserCheck className="w-5 h-5" />, tone: "info" },
    { label: "Last 7 Days", value: users.filter(u => {
      const d = new Date(u.created_at); const week = new Date(); week.setDate(week.getDate() - 7);
      return d > week;
    }).length, icon: <Clock className="w-5 h-5" />, tone: "accent" },
  ];

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary">
            <ShieldCheck className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-primary">Admin Panel</span>
            <span className="ml-2 text-xs text-muted-foreground">Pratibha by SPLINK</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/explorer")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
            <Home className="w-4 h-4" /> Platform
          </button>
          <button onClick={fetchUsers}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition-all">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={async () => { await signOut(); navigate("/"); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-accent-foreground transition-all hover:opacity-90 bg-accent">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome */}
        <div>
          <h2 className="text-2xl font-black text-primary">User Management</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage platform access, roles, and permissions across all registered users.</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s) => {
            const tone =
              s.tone === "info"    ? { bg: "bg-info/10",    fg: "text-info",    num: "text-info" } :
              s.tone === "accent"  ? { bg: "bg-accent/10",  fg: "text-accent",  num: "text-accent" } :
                                     { bg: "bg-primary/10", fg: "text-primary", num: "text-primary" };
            return (
              <div key={s.label} className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone.bg} ${tone.fg}`}>
                    {s.icon}
                  </div>
                </div>
                <div className={`text-3xl font-black mb-0.5 ${tone.num}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Users table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-slate-700">{users.length} Users</span>
            </div>
            <div className="flex items-center gap-1.5">
              {ALL_ROLES.map(r => (
                <span key={r} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${ROLE_COLORS[r]}`}>
                  {ROLE_ICONS[r]} {r}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Sign-in</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {users.map((u) => {
                  const currentRole = (u.roles?.split(", ")[0] as AppRole) ?? "viewer";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" />
                          ) : (
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                              style={{ background: "#1E3A5F" }}>
                              {(u.full_name || u.email || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-slate-800">{u.full_name || "—"}</div>
                            <div className="text-xs text-slate-400">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 capitalize">
                          {u.provider}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {u.created_at ? format(new Date(u.created_at), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {u.last_sign_in_at ? format(new Date(u.last_sign_in_at), "dd MMM yyyy, HH:mm") : "Never"}
                      </td>
                      <td className="px-6 py-4">
                        {u.confirmed_at ? (
                          <span className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-amber-600 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {u.id === user?.id ? (
                          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold w-fit ${ROLE_COLORS[currentRole]}`}>
                            {ROLE_ICONS[currentRole]} {currentRole} (you)
                          </span>
                        ) : (
                          <div className="relative">
                            <button
                              onClick={() => setOpenRoleDropdown(openRoleDropdown === u.id ? null : u.id)}
                              disabled={updatingRole === u.id}
                              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all hover:opacity-80 ${ROLE_COLORS[currentRole]}`}
                            >
                              {updatingRole === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> : ROLE_ICONS[currentRole]}
                              {currentRole}
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {openRoleDropdown === u.id && (
                              <div className="absolute z-20 top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-36">
                                {ALL_ROLES.map(r => (
                                  <button
                                    key={r}
                                    onClick={() => assignRole(u.id, r)}
                                    className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors ${r === currentRole ? "bg-slate-50" : ""}`}
                                  >
                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${ROLE_COLORS[r]}`}>
                                      {ROLE_ICONS[r]} {r}
                                    </span>
                                    {r === currentRole && <span className="text-slate-300 ml-auto">✓</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && (
              <div className="py-16 text-center text-slate-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm">No users yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Close dropdowns on outside click */}
      {openRoleDropdown && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenRoleDropdown(null)} />
      )}
    </div>
  );
}
