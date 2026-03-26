import React from "react";
import { Bell, User, ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useT, useLanguage } from "@/i18n/useTranslation";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Legacy helpers kept for backward-compat with any remaining references
const SESSION_KEY = "pratibha_session";
export function isAuthenticated(): boolean {
  try { return !!sessionStorage.getItem(SESSION_KEY); } catch { return false; }
}
export function setAuthenticated() {
  try { sessionStorage.setItem(SESSION_KEY, "1"); } catch {}
}
export function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}

export function TopHeader({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const { dict } = useT();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const { user, isAdmin, signOut, roles } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const primaryRole = roles[0] ?? "viewer";

  const handleLogout = async () => {
    clearSession();
    await signOut();
    navigate("/", { replace: true });
  };

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-card border-b shrink-0 gap-4">
      {/* Breadcrumb */}
      <div className="flex-1 min-w-0">
        {breadcrumb ?? (
          <span className="text-sm text-muted-foreground">
            {dict.brand} · {dict.brandTagline}
          </span>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Language Toggle */}
        <div className="flex items-center border rounded-md overflow-hidden text-xs font-medium">
          <button
            onClick={() => setLanguage("en")}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >EN</button>
          <button
            onClick={() => setLanguage("hi")}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              language === "hi" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
            )}
          >हिं</button>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-accent" />
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-6 h-6 rounded-full object-cover ring-1 ring-primary/20" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">{initials}</span>
                </div>
              )}
              <span className="text-sm hidden sm:inline max-w-[120px] truncate">{displayName}</span>
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold mt-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary w-fit capitalize">
                  {primaryRole}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              <User size={14} className="mr-2" />
              Profile & Settings
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => navigate("/admin")}>
                <ShieldCheck size={14} className="mr-2" />
                Admin Panel
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
              <LogOut size={14} className="mr-2" />
              {dict.nav.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
