import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { QRModal } from "@/components/dashboard/QRModal";
import { PrescriptionCard } from "@/components/dashboard/PrescriptionCard";
import { commonDrugs, dosageFrequencies, commonDurations } from "@/lib/drugs";
import { prescriptionApi, type Prescription, type RxStatus } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Plus, QrCode, Loader2, Calendar, ChevronDown } from "lucide-react";
import { toast } from "sonner";

const filters: { key: "all" | RxStatus; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "used", label: "Dispensed" },
  { key: "expired", label: "Expired" },
];

const Doctor = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Prescription[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [filter, setFilter] = useState<"all" | RxStatus>("all");
  const [openQR, setOpenQR] = useState<Prescription | null>(null);

  useEffect(() => {
    prescriptionApi.list().then(data => {
      setList(data);
      setLoadingList(false);
    });
  }, []);

  const [form, setForm] = useState({
    patientId: "",
    drug: "",
    dosage: "",
    expiry: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [drugOpen, setDrugOpen] = useState(false);

  const drugMatches = useMemo(
    () => commonDrugs.filter((d) => d.toLowerCase().includes(form.drug.toLowerCase())).slice(0, 5),
    [form.drug],
  );

  const visible = useMemo(
    () => (filter === "all" ? list : list.filter((r) => r.status === filter)),
    [list, filter],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.drug || !form.dosage || !form.expiry) {
      toast.error("Please fill required fields");
      return;
    }
    
    // Validate patient ID format (ETP-XXXX)
    if (!/^ETP-\d{4,}$/i.test(form.patientId)) {
      toast.error("Invalid patient ID format. Use format: ETP-1001");
      return;
    }
    
    setSubmitting(true);
    try {
      const rx = await prescriptionApi.create({
        patientId: form.patientId,
        drug: form.drug,
        dosage: form.dosage,
        expiresAt: form.expiry,
        notes: form.notes,
        doctor: user?.name || "Dr. Hanna Bekele"
      });
      setList((p) => [rx, ...p]);
      setForm({ patientId: "", drug: "", dosage: "", expiry: "", notes: "" });
      toast.success("Prescription committed to ledger", { description: rx.id });
    } catch (error: any) {
      console.error("Prescription creation error:", error);
      toast.error(error.message || "Failed to commit to ledger");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout eyebrow="Doctor workspace" title="Issue with confidence.">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        {/* Form */}
        <form onSubmit={submit} className="xl:col-span-2 glass rounded-3xl p-6 lg:p-8 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">New prescription</h2>
            <Plus className="h-5 w-5 text-foreground/60" />
          </div>

          <div className="mt-8 space-y-5">
            <Field label="Patient ID" required>
              <input
                value={form.patientId}
                onChange={(e) => setForm({ ...form, patientId: e.target.value.toUpperCase() })}
                placeholder="ETP-1001"
                className="rx-input"
                pattern="ETP-\d{4,}"
                title="Patient ID must be in format ETP-1001"
              />
            </Field>

            <Field label="Drug" required>
              <div className="relative">
                <input
                  value={form.drug}
                  onChange={(e) => {
                    setForm({ ...form, drug: e.target.value });
                    setDrugOpen(true);
                  }}
                  onFocus={() => setDrugOpen(true)}
                  onBlur={() => setTimeout(() => setDrugOpen(false), 120)}
                  placeholder="Start typing…"
                  className="rx-input pr-10"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                <AnimatePresence>
                  {drugOpen && form.drug && drugMatches.length > 0 && (
                    <motion.ul
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute z-10 mt-2 w-full bg-background border border-foreground/15 rounded-xl overflow-hidden shadow-[var(--shadow-elevated)]"
                    >
                      {drugMatches.map((d) => (
                        <li key={d}>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setForm({ ...form, drug: d });
                              setDrugOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-foreground/5"
                          >
                            {d}
                          </button>
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Dosage" required>
                <input
                  value={form.dosage}
                  onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                  placeholder="1× daily"
                  className="rx-input"
                />
              </Field>
              <Field label="Expires" required>
                <div className="relative">
                  <input
                    type="date"
                    value={form.expiry}
                    onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                    className="rx-input"
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/50 pointer-events-none" />
                </div>
              </Field>
            </div>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Take after meals…"
                className="rx-input resize-none"
              />
            </Field>
          </div>

          <button type="submit" disabled={submitting} className="btn-ink w-full justify-center mt-8 !py-3.5 disabled:opacity-70">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Committing to chain…
              </>
            ) : (
              <>Issue prescription</>
            )}
          </button>
        </form>

        {/* List */}
        <div className="xl:col-span-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="font-display text-2xl">Recent prescriptions</h2>
            <div className="flex gap-1 p-1 rounded-full border border-foreground/15">
              {filters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                    filter === f.key ? "bg-foreground text-background" : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {visible.map((rx, i) => (
                <PrescriptionCard 
                  key={rx.id} 
                  rx={rx} 
                  index={i} 
                  onViewDetails={setOpenQR} 
                />
              ))}
            </AnimatePresence>
            {loadingList ? (
              <div className="text-center py-16 text-foreground/50 flex flex-col items-center">
                <Loader2 className="h-6 w-6 animate-spin mb-4" />
                Synchronizing with ledger...
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-16 text-foreground/50">No prescriptions in this view.</div>
            ) : null}
          </div>
        </div>
      </div>

      <QRModal rx={openQR} open={!!openQR} onOpenChange={(v) => !v && setOpenQR(null)} />
    </DashboardLayout>
  );
};

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block">
    <span className="font-mono-tight text-foreground/60 mb-2 block">
      {label} {required && <span className="text-[hsl(var(--signal))]">*</span>}
    </span>
    {children}
  </label>
);

export default Doctor;
