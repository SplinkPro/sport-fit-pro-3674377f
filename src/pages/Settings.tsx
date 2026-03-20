import { useState } from "react";
import { Users, Brain, Trophy, BarChart2, FlaskConical, Palette, Database, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "users", label: "Users & Roles", icon: Users },
  { id: "ai", label: "AI Configuration", icon: Brain },
  { id: "sports", label: "Sport Taxonomy", icon: Trophy },
  { id: "weights", label: "Metric Weights", icon: BarChart2 },
  { id: "methodology", label: "Methodology", icon: FlaskConical },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "data", label: "Data Retention", icon: Database },
];

const USERS = [
  { id: 1, name: "Admin User", email: "admin@splink.in", role: "Super Admin", status: "active" },
  { id: 2, name: "Coach Sharma", email: "sharma@school.in", role: "Coach", status: "active" },
  { id: 3, name: "Analyst Priya", email: "priya@school.in", role: "Analyst", status: "active" },
  { id: 4, name: "Viewer Rahul", email: "rahul@school.in", role: "Viewer", status: "inactive" },
];

const ROLE_COLORS: Record<string, string> = {
  "Super Admin": "bg-primary/10 text-primary",
  "Admin": "bg-accent/10 text-accent",
  "Coach": "bg-success/10 text-success",
  "Analyst": "bg-warning/10 text-warning",
  "Viewer": "bg-muted text-muted-foreground",
};

const SPORTS_LIST = [
  { id: 1, name: "Athletics (Track & Field)", enabled: true, athletes: 24 },
  { id: 2, name: "Football", enabled: true, athletes: 18 },
  { id: 3, name: "Kabaddi", enabled: true, athletes: 15 },
  { id: 4, name: "Cycling", enabled: true, athletes: 11 },
  { id: 5, name: "Volleyball", enabled: true, athletes: 9 },
  { id: 6, name: "Swimming", enabled: false, athletes: 0 },
  { id: 7, name: "Wrestling", enabled: true, athletes: 7 },
  { id: 8, name: "Badminton", enabled: false, athletes: 0 },
];

const METRICS = [
  { name: "Vertical Jump", weight: 20, unit: "cm" },
  { name: "Broad Jump", weight: 20, unit: "cm" },
  { name: "30m Sprint", weight: 25, unit: "sec" },
  { name: "800m Run", weight: 20, unit: "min" },
  { name: "Shuttle Run", weight: 10, unit: "sec" },
  { name: "Football Throw", weight: 5, unit: "m" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("users");
  const [aiEnabled, setAiEnabled] = useState(true);
  const [fallbackEnabled, setFallbackEnabled] = useState(true);
  const [apiKey, setApiKey] = useState("sk-••••••••••••••••••••");
  const [sports, setSports] = useState(SPORTS_LIST);

  const toggleSport = (id: number) => {
    setSports(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure users, AI, sports taxonomy, metric weights, and branding.</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">

          {/* Users & Roles */}
          {activeTab === "users" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Users & Roles</CardTitle>
                  <CardDescription>Manage platform users and their access levels.</CardDescription>
                </div>
                <Button size="sm" className="gap-1">+ Add User</Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {USERS.map((u) => (
                    <div key={u.id} className="py-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {u.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{u.name}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </div>
                      <Badge className={cn("text-xs border-0", ROLE_COLORS[u.role])}>{u.role}</Badge>
                      <Badge variant={u.status === "active" ? "default" : "outline"} className="text-xs">
                        {u.status}
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs h-7">Edit</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Configuration */}
          {activeTab === "ai" && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Configuration</CardTitle>
                  <CardDescription>Configure AI models and API keys. The platform works without AI using deterministic rules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Enable AI Summaries</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Generate narrative insights using AI language models</p>
                    </div>
                    <Switch checked={aiEnabled} onCheckedChange={setAiEnabled} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium">Rules-only Fallback</Label>
                      <p className="text-xs text-muted-foreground mt-0.5">Fall back to template-based summaries if AI is unavailable</p>
                    </div>
                    <Switch checked={fallbackEnabled} onCheckedChange={setFallbackEnabled} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">API Key (OpenAI compatible)</Label>
                    <div className="flex gap-2">
                      <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="font-mono text-sm" />
                      <Button variant="outline" size="sm">Update</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Your API key is stored locally. It never leaves this instance.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { task: "Insight Summaries", model: "gpt-4o-mini" },
                      { task: "Sport Recommendations", model: "rules-engine" },
                      { task: "Query Assistant", model: "gpt-4o-mini" },
                      { task: "Report Writing", model: "gpt-4o-mini" },
                    ].map((item) => (
                      <div key={item.task} className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground">{item.task}</div>
                        <div className="text-sm font-mono font-medium mt-1">{item.model}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Sport Taxonomy */}
          {activeTab === "sports" && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Sport Taxonomy</CardTitle>
                  <CardDescription>Enable/disable sports and configure their athlete fit weighting.</CardDescription>
                </div>
                <Button size="sm">+ Add Sport</Button>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  {sports.map((s) => (
                    <div key={s.id} className="py-3 flex items-center gap-3">
                      <Switch checked={s.enabled} onCheckedChange={() => toggleSport(s.id)} />
                      <div className="flex-1">
                        <div className={cn("text-sm font-medium", !s.enabled && "text-muted-foreground")}>{s.name}</div>
                        <div className="text-xs text-muted-foreground">{s.athletes > 0 ? `${s.athletes} athletes matched` : "Not active"}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs h-7" disabled={!s.enabled}>Configure Weights</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metric Weights */}
          {activeTab === "weights" && (
            <Card>
              <CardHeader>
                <CardTitle>Composite Score Weights</CardTitle>
                <CardDescription>Configure how each metric contributes to the Composite Athlete Potential Index. Weights must sum to 100.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {METRICS.map((m) => (
                    <div key={m.name} className="flex items-center gap-3">
                      <div className="w-40 text-sm text-muted-foreground shrink-0">{m.name}</div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${m.weight}%` }} />
                      </div>
                      <div className="w-16 text-right">
                        <Input
                          type="number"
                          value={m.weight}
                          className="h-7 text-xs text-right px-2"
                          min={0} max={100}
                          readOnly
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-4">%</span>
                    </div>
                  ))}
                  <div className="flex justify-between pt-2 border-t text-sm">
                    <span className="text-muted-foreground">Total weight</span>
                    <span className="font-bold text-success">100%</span>
                  </div>
                </div>
                <Button className="mt-4" size="sm">Save Weights</Button>
              </CardContent>
            </Card>
          )}

          {/* Methodology Settings */}
          {activeTab === "methodology" && (
            <Card>
              <CardHeader>
                <CardTitle>Methodology Settings</CardTitle>
                <CardDescription>Configure benchmark band thresholds and cohort definitions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { band: "Excellent", threshold: "> 85th percentile", color: "text-success" },
                    { band: "Above Average", threshold: "70th – 85th percentile", color: "text-primary" },
                    { band: "Average", threshold: "40th – 70th percentile", color: "text-foreground" },
                    { band: "Below Average", threshold: "20th – 40th percentile", color: "text-warning" },
                    { band: "Development Needed", threshold: "< 20th percentile", color: "text-destructive" },
                  ].map((b) => (
                    <div key={b.band} className="bg-muted/30 rounded-lg p-3 flex justify-between items-center">
                      <span className={cn("text-sm font-medium", b.color)}>{b.band}</span>
                      <span className="text-xs text-muted-foreground font-mono">{b.threshold}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Cohort definition: same gender + age band (±1 year). Minimum cohort size: 5 athletes.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Branding */}
          {activeTab === "branding" && (
            <Card>
              <CardHeader>
                <CardTitle>Branding</CardTitle>
                <CardDescription>Configure client name, logo, and report header for this instance.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Client Name</Label>
                  <Input defaultValue="Bihar Sports Department" />
                </div>
                <div className="space-y-2">
                  <Label>Instance Code</Label>
                  <Input defaultValue="BIHAR-2024" className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label>Report Header Text</Label>
                  <Input defaultValue="Pratibha Athlete Intelligence Platform | Bihar Sports" />
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <div className="text-xs text-muted-foreground mb-2">Logo Upload</div>
                  <Button variant="outline" size="sm">Upload Logo</Button>
                </div>
                <Button size="sm">Save Branding</Button>
              </CardContent>
            </Card>
          )}

          {/* Data Retention */}
          {activeTab === "data" && (
            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>Configure data retention policies and view audit logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { label: "Athlete records retention", value: "Indefinite (no auto-delete)" },
                    { label: "Import history retention", value: "24 months" },
                    { label: "Audit log retention", value: "12 months" },
                    { label: "AI query log retention", value: "6 months" },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between items-center py-2 border-b last:border-0">
                      <span className="text-sm text-muted-foreground">{r.label}</span>
                      <Badge variant="outline" className="text-xs font-mono">{r.value}</Badge>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    All data is stored on this client's own infrastructure. No athlete data is transmitted to external servers.
                    Only license heartbeat metadata (user count, athlete count, version) is sent to the vendor licensing server.
                  </p>
                </div>
                <Button variant="outline" size="sm">View Audit Log</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
