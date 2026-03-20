import React from "react";
import { Bell, User, ChevronDown } from "lucide-react";
import { useT, useLanguage } from "@/i18n/useTranslation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function TopHeader({ breadcrumb }: { breadcrumb?: React.ReactNode }) {
  const { dict } = useT();
  const { language, setLanguage } = useLanguage();

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
              language === "en"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={cn(
              "px-2.5 py-1.5 transition-colors",
              language === "hi"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            हिं
          </button>
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
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">SA</span>
              </div>
              <span className="text-sm hidden sm:inline">Super Admin</span>
              <ChevronDown size={12} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem>
              <User size={14} className="mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              {dict.nav.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
