import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Check, X, ShieldAlert, Activity, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "@/lib/api";

type Tab = "Doctor" | "Pharmacist";

const Admin = () => {
  const [tab, setTab] = useState<Tab>("Doctor");
  const [people, setPeople] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.listPractitioners(),
      adminApi.listFraudAlerts(),
      adminApi.getStats()
    ]).then(([p, a, s]) => {
      setPeople(p);
      setAlerts(a);
      setStats(s);
      setLoading(false);
    });
  }, []);

  const rows = people.filter((p) => p.role === tab);

  const decide = async (id: string, status: "approved" | "rejected") => {
    try {
      if (status === "approved") await adminApi.approve(id);
      else await adminApi.reject(id);
      
      setPeople((p) => p.map((row) => (row.id === id ? { ...row, status } : row)));
      toast.success(status === "approved" ? "Approved" : "Rejected", { description: id });
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <DashboardLayout eyebrow="Admin · oversight" title="Govern the chain.">
      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Kpi label="Doctors" value={loading ? "-" : stats?.doctors.toString()} delta="+3" />
        <Kpi label="Pharmacists" value={loading ? "-" : stats?.pharmacists.toString()} delta="+9" />
        <Kpi label="Scripts (24h)" value={loading ? "-" : stats?.scriptsToday.toString()} delta="+12%" />
        <Kpi label="Fraud alerts" value={loading ? "-" : stats?.fraudAlerts.toString()} delta="−2" tone="warn" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Practitioners table */}
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl">Practitioners</h2>
            <div className="flex gap-1 p-1 rounded-full border border-foreground/15">
              {(["Doctor", "Pharmacist"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 rounded-full text-xs transition-colors ${
                    tab === t ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {t}s
                </button>
              ))}
            </div>
          </div>

          <div className="glass rounded-3xl overflow-hidden">
            <div className="grid grid-cols-12 px-6 py-3 border-b border-foreground/15 font-mono-tight text-foreground/55">
              <div className="col-span-4">Name</div>
              <div className="col-span-3 hidden sm:block">Facility</div>
              <div className="col-span-2 hidden md:block">Joined</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-right">Action</div>
            </div>
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="h-6 w-6 animate-spin text-foreground/50" /></div>
            ) : (
              <AnimatePresence>
                {rows.map((p, i) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: i * 0.04 }}
                    className="grid grid-cols-12 items-center px-6 py-4 border-b border-foreground/10 last:border-0 hover:bg-foreground/[0.03] transition-colors"
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-foreground text-background grid place-items-center text-xs font-semibold shrink-0">
                        {p.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.name}</div>
                        <div className="font-mono-tight text-foreground/50">{p.id}</div>
                      </div>
                    </div>
                    <div className="col-span-3 hidden sm:block text-sm text-foreground/75 truncate">{p.facility}</div>
                    <div className="col-span-2 hidden md:block text-sm text-foreground/65 font-mono-tight">{p.joined}</div>
                    <div className="col-span-2">
                      <StatusPill status={p.status} />
                    </div>
                    <div className="col-span-1 flex justify-end gap-1">
                      {p.status === "pending" ? (
                        <>
                          <button
                            onClick={() => decide(p.id, "approved")}
                            className="h-8 w-8 grid place-items-center rounded-full border border-foreground/15 hover:bg-[hsl(var(--verify))] hover:text-background hover:border-transparent transition-colors"
                            aria-label="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => decide(p.id, "rejected")}
                            className="h-8 w-8 grid place-items-center rounded-full border border-foreground/15 hover:bg-destructive hover:text-destructive-foreground hover:border-transparent transition-colors"
                            aria-label="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="font-mono-tight text-foreground/40">—</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Fraud alerts */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-2xl">Fraud alerts</h2>
            <span className="pill">
              <Activity className="h-3.5 w-3.5 text-[hsl(var(--signal))] animate-pulse" />
              Live
            </span>
          </div>
          <ul className="space-y-3">
            {loading ? (
              <div className="flex justify-center p-6"><Loader2 className="h-5 w-5 animate-spin text-foreground/50" /></div>
            ) : alerts.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: i * 0.06 }}
                className="glass rounded-2xl p-4 flex items-start gap-3"
              >
                <div
                  className={`h-9 w-9 rounded-xl grid place-items-center shrink-0 ${
                    a.severity === "high"
                      ? "bg-destructive/15 text-destructive"
                      : a.severity === "medium"
                      ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                      : "bg-foreground/10 text-foreground/70"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{a.type}</div>
                  <div className="font-mono-tight text-foreground/50 mt-0.5">
                    {a.entity} · {a.at}
                  </div>
                </div>
                <button className="text-xs underline underline-offset-4 text-foreground/70 hover:text-foreground">
                  Review
                </button>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

const Kpi = ({ label, value, delta, tone }: { label: string; value: string; delta: string; tone?: "warn" }) => (
  <div className="glass rounded-3xl p-5">
    <div className="font-mono-tight text-foreground/55">{label}</div>
    <div className="mt-3 flex items-end justify-between">
      <div className="font-display text-3xl">{value}</div>
      <div className={`font-mono-tight ${tone === "warn" ? "text-[hsl(var(--signal))]" : "text-[hsl(var(--verify))]"}`}>
        {delta}
      </div>
    </div>
  </div>
);

const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    approved: "text-[hsl(var(--verify))] border-[hsl(var(--verify))]/30 bg-[hsl(var(--verify))]/10",
    pending: "text-[hsl(var(--signal))] border-[hsl(var(--signal))]/30 bg-[hsl(var(--signal))]/10",
    rejected: "text-destructive border-destructive/30 bg-destructive/10",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono-tight ${map[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
};

export default Admin;
