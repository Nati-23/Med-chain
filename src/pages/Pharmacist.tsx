import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { prescriptionApi, type Prescription } from "@/lib/api";
import { ScanLine, Camera, CheckCircle2, AlertTriangle, XCircle, RotateCcw, PackageCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Pharmacist = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Prescription | null>(null);
  const [dispensed, setDispensed] = useState(false);
  const [manualId, setManualId] = useState("");
  const [verifying, setVerifying] = useState(false);

  const verifyPrescription = async (prescriptionId: string) => {
    setVerifying(true);
    try {
      const data = await prescriptionApi.verify(prescriptionId);
      if (data.prescription) {
        setResult(data.prescription);
        toast.success(`Prescription ${data.status}`, {
          description: data.status === "valid" ? "Ready for dispensing" : `Status: ${data.status}`
        });
      } else {
        toast.error("Prescription not found or invalid");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
      setScanning(false);
    }
  };

  const verifyPrescriptionByHashAndCid = async (hash: string, cid: string) => {
    setVerifying(true);
    try {
      const data = await prescriptionApi.verifyByHashAndCid({ hash, cid });
      if (data.prescription) {
        setResult(data.prescription);
        toast.success(`Prescription ${data.status}`, {
          description: data.status === "valid" ? "Ready for dispensing" : `Status: ${data.status}`
        });
      } else {
        toast.error("Prescription not found or invalid");
      }
    } catch (error: any) {
      toast.error(error.message || "Verification failed");
    } finally {
      setVerifying(false);
      setScanning(false);
    }
  };

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          videoConstraints: { facingMode: "environment" }
        },
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear();
          setScanning(false);
          try {
            const url = new URL(decodedText);
            const hash = url.searchParams.get("hash");
            const cid = url.searchParams.get("cid");

            if (hash && cid) {
              verifyPrescriptionByHashAndCid(hash, cid);
            } else {
              toast.error("Invalid QR code format");
            }
          } catch {
            verifyPrescription(decodedText);
          }
        },
        (error) => {
          // ignore constant errors during scanning
        }
      );

      return () => {
        scanner.clear().catch(console.error);
      };
    }
  }, [scanning]);

  const startScan = () => {
    setResult(null);
    setDispensed(false);
    setScanning(true);
    // In a real implementation, this would open camera/QR scanner
    // For now, we'll use manual ID entry
    toast.info("Enter prescription ID manually or scan QR code");
  };

  const handleManualVerify = () => {
    if (!manualId.trim()) {
      toast.error("Please enter a prescription ID");
      return;
    }
    verifyPrescription(manualId.trim());
  };

  const dispense = async () => {
    if (!result) return;
    
    // Final check for status before dispensing
    const now = new Date();
    const expiryDate = new Date(result.expiresAt);
    if (result.status === "used" || result.status === "expired" || now > expiryDate) {
      toast.error("Cannot dispense: Prescription is no longer valid");
      return;
    }

    toast.loading("Marking on ledger…", { id: "disp" });
    try {
      const updated = await prescriptionApi.dispense(result.id);
      setResult(updated);
      setDispensed(true);
      toast.success("Dispensed and recorded", { id: "disp", description: result.id });
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as dispensed", { id: "disp" });
    }
  };

  const reset = () => {
    setResult(null);
    setDispensed(false);
    setScanning(false);
  };

  // Determine the effective status including frontend expiry check
  const getEffectiveStatus = () => {
    if (dispensed) return "used";
    if (!result) return "active";
    const now = new Date();
    const expiryDate = new Date(result.expiresAt);
    if (result.status === "used") return "used";
    if (result.status === "expired" || now > expiryDate) return "expired";
    return "active";
  };

  const status = getEffectiveStatus();

  const tones = {
    active: { ring: "ring-[hsl(var(--verify))]/40", glow: "shadow-[0_0_80px_-10px_hsl(var(--verify)/0.5)]", icon: CheckCircle2, label: "VALID", text: "text-[hsl(var(--verify))]" },
    used:    { ring: "ring-yellow-500/40", glow: "shadow-[0_0_80px_-10px_rgba(234,179,8,0.45)]", icon: AlertTriangle, label: "DISPENSED", text: "text-yellow-600 dark:text-yellow-400" },
    expired: { ring: "ring-destructive/40", glow: "shadow-[0_0_80px_-10px_hsl(var(--destructive)/0.45)]", icon: XCircle, label: "EXPIRED", text: "text-destructive" },
  } as const;

  return (
    <DashboardLayout eyebrow="Pharmacist · scanner" title="Dispense without doubt.">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Scanner viewport */}
        <div className="lg:col-span-3">
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden border border-foreground/15 bg-foreground text-background">
            {/* Faux camera bg */}
            <div
              className="absolute inset-0 opacity-50"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 30%, hsl(var(--signal)/0.25), transparent 60%), radial-gradient(ellipse at 70% 70%, hsl(var(--signal-2)/0.2), transparent 55%), linear-gradient(180deg, #0b0e14, #0b0e14)",
              }}
            />
            {/* Crosshair */}
            <div className="absolute inset-12 lg:inset-16 border border-background/30 rounded-2xl">
              <Corner className="-top-px -left-px" />
              <Corner className="-top-px -right-px rotate-90" />
              <Corner className="-bottom-px -right-px rotate-180" />
              <Corner className="-bottom-px -left-px -rotate-90" />
              {scanning && (
                <div className="absolute inset-x-2 top-2 bottom-2 overflow-hidden rounded-xl bg-black/80">
                  <div id="reader" className="w-full h-full [&>div]:border-none [&_video]:object-cover [&_video]:h-full" />
                </div>
              )}
            </div>

            <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
              <span className="pill !bg-background/15 !border-background/25 !text-background/80">
                <ScanLine className="h-3.5 w-3.5" /> Live scanner
              </span>
              <span className="font-mono-tight text-background/60">CAM 01 · 1080p</span>
            </div>

            <div className="absolute bottom-6 inset-x-0 flex justify-center">
              {!scanning && !result && (
                <button onClick={startScan} className="rounded-full bg-background text-foreground px-6 py-3 text-sm font-medium inline-flex items-center gap-2 hover:scale-[1.02] transition-transform">
                  <Camera className="h-4 w-4" /> Start scanning
                </button>
              )}
              {scanning && (
                <span className="rounded-full bg-background/15 backdrop-blur text-background px-5 py-2.5 text-xs font-mono-tight inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning for QR…
                </span>
              )}
              {result && (
                <button onClick={reset} className="rounded-full bg-background/15 backdrop-blur text-background px-5 py-2.5 text-xs inline-flex items-center gap-2 hover:bg-background/25 transition-colors">
                  <RotateCcw className="h-3.5 w-3.5" /> Scan another
                </button>
              )}
            </div>
          </div>

          {/* Manual verification hint */}
          <div className="mt-4 text-xs text-foreground/50 font-mono-tight">
            Enter a prescription ID manually to verify authenticity
          </div>
        </div>

        {/* Result */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!result ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass rounded-3xl p-10 h-full grid place-items-center text-center"
              >
                <div>
                  <div className="mx-auto h-12 w-12 rounded-2xl border border-foreground/20 grid place-items-center">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-2xl">Awaiting scan</h3>
                  <p className="mt-2 text-sm text-foreground/60">Point the camera at a patient's prescription QR.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={result.id + (dispensed ? "-d" : "")}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={`glass rounded-3xl p-7 ring-2 ${tones[status as keyof typeof tones].ring} ${tones[status as keyof typeof tones].glow}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-tight text-foreground/50">{result.id}</span>
                  <StatusBadge status={status as Prescription["status"]} />
                </div>

                <div className={`mt-6 inline-flex items-center gap-2 ${tones[status as keyof typeof tones].text}`}>
                  {(() => {
                    const I = tones[status as keyof typeof tones].icon;
                    return <I className="h-6 w-6" strokeWidth={1.6} />;
                  })()}
                  <span className="font-mono-tight text-sm tracking-[0.18em]">
                    {tones[status as keyof typeof tones].label}
                  </span>
                </div>

                <h3 className="mt-3 font-display text-3xl leading-tight">{result.drug}</h3>
                <p className="mt-1 text-sm text-foreground/65">{result.dosage}</p>

                <dl className="mt-6 space-y-3 text-sm">
                  <Row k="Patient" v={`${result.patientName} · ${result.patientId}`} />
                  <Row k="Doctor" v={result.doctor} />
                  <Row k="Expires" v={new Date(result.expiresAt).toLocaleString()} />
                </dl>

                <div className="flex justify-center mt-6">
                  <div className="inline-flex items-center gap-2 bg-[#0052FF]/10 text-[#0052FF] dark:text-[#528bff] px-4 py-2 rounded-full text-xs font-medium border border-[#0052FF]/20">
                    <CheckCircle2 className="h-4 w-4" />
                    Verified on Base
                  </div>
                </div>

                <button
                  onClick={dispense}
                  disabled={status !== "active"}
                  className="btn-ink w-full justify-center mt-7 !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PackageCheck className="h-4 w-4" />
                  {status === "used" ? "Dispensed" : status === "expired" ? "Cannot dispense (Expired)" : "Mark as dispensed"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex items-center justify-between gap-4">
    <dt className="font-mono-tight text-foreground/55">{k}</dt>
    <dd className="text-right truncate">{v}</dd>
  </div>
);

const Corner = ({ className = "" }: { className?: string }) => (
  <span className={`absolute h-5 w-5 border-t-2 border-l-2 border-[hsl(var(--signal))] ${className}`} />
);

export default Pharmacist;
