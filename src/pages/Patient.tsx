import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { QRModal } from "@/components/dashboard/QRModal";
import { PrescriptionCard } from "@/components/dashboard/PrescriptionCard";
import type { Prescription } from "@/lib/mock-data";
import { QrCode, Pill, Loader2 } from "lucide-react";
import { prescriptionApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const Patient = () => {
  const { user } = useAuth();
  const patientId = user?.patientId || "ETP-9921";
  
  const [items, setItems] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [openQR, setOpenQR] = useState<Prescription | null>(null);

  useEffect(() => {
    prescriptionApi.list({ patientId }).then(data => {
      setItems(data);
      setLoading(false);
    });
  }, [patientId]);

  return (
    <DashboardLayout eyebrow={`Patient · ${patientId}`} title="Carry trust in your pocket.">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
        <Stat label="Active scripts" value={loading ? "-" : items.filter((i) => i.status === "active").length.toString()} />
        <Stat label="This year" value={loading ? "-" : items.length.toString()} />
        <Stat label="Last visit" value={loading || items.length === 0 ? "-" : new Date(items[0]?.issuedAt).toLocaleDateString()} />
      </div>

      <div className="relative">
        {/* Vertical timeline rule */}
        <div className="absolute left-4 lg:left-6 top-2 bottom-2 w-px bg-foreground/15" aria-hidden />
        
        {loading ? (
          <div className="flex flex-col items-center py-12 text-foreground/50 pl-10">
            <Loader2 className="h-6 w-6 animate-spin mb-4" />
            Loading prescriptions...
          </div>
        ) : items.length === 0 ? (
          <div className="pl-12 lg:pl-16 py-6 text-foreground/50">No prescriptions found.</div>
        ) : (
          <ul className="space-y-6">
            {items.map((rx, i) => (
              <motion.li
                key={rx.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.55, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="relative pl-12 lg:pl-16"
              >
                <div className="absolute left-[10px] lg:left-[18px] top-10 h-3 w-3 rounded-full bg-foreground ring-4 ring-background z-10" />
                <div className="font-mono-tight text-foreground/50 mb-2">
                  {new Date(rx.issuedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <PrescriptionCard 
                  rx={rx} 
                  index={i} 
                  onViewDetails={setOpenQR} 
                />
              </motion.li>
            ))}
          </ul>
        )}
      </div>

      <QRModal rx={openQR} open={!!openQR} onOpenChange={(v) => !v && setOpenQR(null)} />
    </DashboardLayout>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="glass rounded-3xl p-6">
    <div className="font-mono-tight text-foreground/60">{label}</div>
    <div className="mt-3 font-display text-4xl">{value}</div>
  </div>
);

export default Patient;
