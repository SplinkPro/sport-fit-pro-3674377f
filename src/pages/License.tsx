import { CheckCircle, AlertTriangle, RefreshCw, Shield, Key, Users, Database, Clock, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const LICENSE_DATA = {
  key: "SPLNK-BIHAR-2024-8F42B1C3",
  plan: "Professional",
  status: "active",
  client: "Bihar Sports Department",
  instanceId: "8F42B1C3-5D9E-4A7B-B2E1-9C3F4D5A6E7B",
  activatedOn: "2024-01-15",
  expiresOn: "2025-01-14",
  daysRemaining: 298,
  lastHeartbeat: "2 minutes ago",
  heartbeatStatus: "healthy",
  version: "1.0.0",
  usage: {
    users: { used: 4, limit: 20 },
    athletes: { used: 82, limit: 500 },
    analyses: { used: 1240, limit: 5000 },
  },
  modules: ["Athlete Explorer", "Athlete Profile", "Analytics Dashboard", "Data Import", "AI Query Assistant", "Reports", "Settings"],
  heartbeatHistory: [
    { date: "2024-03-19 14:32", status: "ok", latency: "120ms" },
    { date: "2024-03-18 14:31", status: "ok", latency: "98ms" },
    { date: "2024-03-17 14:30", status: "ok", latency: "145ms" },
    { date: "2024-03-16 09:15", status: "missed", latency: "—" },
    { date: "2024-03-15 14:29", status: "ok", latency: "112ms" },
  ],
};

export default function LicensePage() {
  const daysPercent = Math.round((LICENSE_DATA.daysRemaining / 365) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" /> License Management
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Instance license status, usage, and heartbeat.</p>
        </div>
        <Badge className="bg-success/10 text-success border-success/20 text-sm px-3 py-1 gap-1">
          <CheckCircle className="w-4 h-4" /> Active
        </Badge>
      </div>

      {/* License Key Card */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">License Key</div>
              <div className="font-mono text-sm font-semibold mt-1">{LICENSE_DATA.key}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Plan</div>
              <div className="text-sm font-semibold mt-1">{LICENSE_DATA.plan}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Client</div>
              <div className="text-sm font-semibold mt-1">{LICENSE_DATA.client}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Instance ID</div>
              <div className="font-mono text-xs text-muted-foreground mt-1 break-all">{LICENSE_DATA.instanceId}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Expiry */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> License Validity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Activated</span>
              <span className="font-medium">{LICENSE_DATA.activatedOn}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Expires</span>
              <span className="font-medium">{LICENSE_DATA.expiresOn}</span>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">Days remaining</span>
                <span className="font-semibold text-success">{LICENSE_DATA.daysRemaining} days</span>
              </div>
              <Progress value={daysPercent} className="h-2" />
            </div>
            <Button variant="outline" size="sm" className="w-full gap-2 mt-1">
              <RefreshCw className="w-3 h-3" /> Renew License
            </Button>
          </CardContent>
        </Card>

        {/* Heartbeat */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Wifi className="w-4 h-4" /> Heartbeat Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Last sync</span>
              <Badge className="bg-success/10 text-success border-success/20 text-xs">{LICENSE_DATA.lastHeartbeat}</Badge>
            </div>
            <div className="space-y-1.5">
              {LICENSE_DATA.heartbeatHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                  <span className="text-muted-foreground font-mono">{h.date}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{h.latency}</span>
                    <Badge variant={h.status === "ok" ? "default" : "outline"}
                      className={h.status === "ok" ? "bg-success/10 text-success border-success/20 text-xs" : "text-xs text-warning border-warning/30"}>
                      {h.status === "ok" ? "✓ OK" : "⚠ Missed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage meters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Database className="w-4 h-4" /> Usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "Platform Users", icon: Users, used: LICENSE_DATA.usage.users.used, limit: LICENSE_DATA.usage.users.limit, unit: "users" },
            { label: "Athlete Records", icon: Database, used: LICENSE_DATA.usage.athletes.used, limit: LICENSE_DATA.usage.athletes.limit, unit: "athletes" },
            { label: "AI Analyses Run", icon: Shield, used: LICENSE_DATA.usage.analyses.used, limit: LICENSE_DATA.usage.analyses.limit, unit: "analyses" },
          ].map((m) => {
            const pct = Math.round((m.used / m.limit) * 100);
            return (
              <div key={m.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <m.icon className="w-3.5 h-3.5" /> {m.label}
                  </span>
                  <span className="font-medium">
                    {m.used.toLocaleString()} / {m.limit.toLocaleString()}
                    <span className="text-muted-foreground font-normal ml-1">{m.unit}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-10 text-right">{pct}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Licensed Modules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {LICENSE_DATA.modules.map((m) => (
              <Badge key={m} className="bg-success/10 text-success border-success/20 text-xs gap-1">
                <CheckCircle className="w-3 h-3" /> {m}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Privacy statement */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground mb-1">Data Privacy Guarantee</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Only the following metadata is transmitted to the SPLINK licensing server: instance ID, license key, plan type, active user count, total athlete count, platform version, and heartbeat timestamps.
                <strong className="text-foreground"> No athlete names, IDs, assessment values, health data, or reports are ever sent to SPLINK or any external server.</strong> All athlete data remains exclusively on your instance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
