import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { prescriptionApi, type Prescription } from "@/lib/api";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { CheckCircle2, AlertTriangle, XCircle, RotateCcw, Loader2, ShieldCheck, HeartPulse } from "lucide-react";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const hash = searchParams.get("hash");
  const cid = searchParams.get("cid");

  const [verifying, setVerifying] = useState(true);
  const [result, setResult] = useState<Prescription | null>(null);
  const [status, setStatus] = useState<"valid" | "expired" | "used" | "not_found">("valid");
  const [error, setError] = useState<string | null>(null);

  const verifyPrescription = async () => {
    if (!hash || !cid) {
      setError("Invalid verification URL. Missing parameters.");
      setVerifying(false);
      return;
    }

    setVerifying(true);
    setError(null);
    try {
      // Temporary workaround if the backend requires ID instead of just hash/cid
      // The updated backend api.ts verify method should accept hash and cid
      // Wait, api.ts verify method currently takes an ID. I need to update api.ts.
      // For now, I'll assume we update api.ts to accept {hash, cid}
      const data = await prescriptionApi.verifyByHashAndCid({ hash, cid });
      if (data.prescription) {
        setResult(data.prescription);
        setStatus(data.status);
      } else {
        setError("Prescription not found or invalid.");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    verifyPrescription();
  }, [hash, cid]);

  const tones = {
    valid: { ring: "ring-[hsl(var(--verify))]/40", glow: "shadow-[0_0_80px_-10px_hsl(var(--verify)/0.5)]", icon: CheckCircle2, label: "VALID", text: "text-[hsl(var(--verify))]" },
    used: { ring: "ring-yellow-500/40", glow: "shadow-[0_0_80px_-10px_rgba(234,179,8,0.45)]", icon: AlertTriangle, label: "DISPENSED", text: "text-yellow-600 dark:text-yellow-400" },
    expired: { ring: "ring-destructive/40", glow: "shadow-[0_0_80px_-10px_hsl(var(--destructive)/0.45)]", icon: XCircle, label: "EXPIRED", text: "text-destructive" },
    not_found: { ring: "ring-destructive/40", glow: "shadow-[0_0_80px_-10px_hsl(var(--destructive)/0.45)]", icon: XCircle, label: "INVALID", text: "text-destructive" },
  } as const;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--signal))]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--signal-2))]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="z-10 w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 hover:opacity-80 transition-opacity">
          <ShieldCheck className="h-6 w-6 text-[hsl(var(--signal))]" />
          <span className="font-display text-xl tracking-tight">MedChain Verify</span>
        </Link>

        <AnimatePresence mode="wait">
          {verifying ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-3xl p-10 text-center flex flex-col items-center justify-center min-h-[300px]"
            >
              <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--signal))]" />
              <h3 className="mt-6 font-display text-2xl">Verifying...</h3>
              <p className="mt-2 text-sm text-foreground/60">Checking cryptographic signatures on Base.</p>
            </motion.div>
          ) : error || !result ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="glass rounded-3xl p-10 text-center ring-2 ring-destructive/40 shadow-[0_0_80px_-10px_hsl(var(--destructive)/0.3)] min-h-[300px] flex flex-col items-center justify-center"
            >
              <XCircle className="h-10 w-10 text-destructive mb-4" />
              <h3 className="font-display text-2xl">Verification Failed</h3>
              <p className="mt-2 text-sm text-foreground/60 mb-8">{error}</p>
              <button
                onClick={verifyPrescription}
                className="btn-ghost inline-flex items-center gap-2 px-6"
              >
                <RotateCcw className="h-4 w-4" /> Try Again
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className={`glass rounded-3xl p-8 ring-2 ${tones[status as keyof typeof tones].ring} ${tones[status as keyof typeof tones].glow}`}
            >
              <div className="flex items-center justify-center mb-6">
                 <div className={`inline-flex items-center gap-2 ${tones[status as keyof typeof tones].text} bg-background/50 backdrop-blur px-4 py-2 rounded-full`}>
                  {(() => {
                    const I = tones[status as keyof typeof tones].icon;
                    return <I className="h-5 w-5" strokeWidth={2} />;
                  })()}
                  <span className="font-mono-tight text-sm font-bold tracking-widest">
                    {tones[status as keyof typeof tones].label}
                  </span>
                </div>
              </div>

              <div className="text-center mb-8">
                <h3 className="font-display text-3xl leading-tight mb-2">{result.drug}</h3>
                <p className="text-sm text-foreground/70">{result.dosage}</p>
              </div>

              <div className="space-y-4 text-sm bg-foreground/5 rounded-2xl p-5 mb-8">
                <div className="flex justify-between items-center border-b border-foreground/10 pb-3">
                  <span className="text-foreground/50 font-mono-tight">Patient ID</span>
                  <span className="font-medium text-right">{result.patientId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-foreground/10 pb-3">
                  <span className="text-foreground/50 font-mono-tight">Doctor</span>
                  <span className="font-medium text-right">{result.doctor}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground/50 font-mono-tight">Expires</span>
                  <span className="font-medium text-right">
                    {new Date(result.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex justify-center mt-6">
                <div className="inline-flex items-center gap-2 bg-[#0052FF]/10 text-[#0052FF] dark:text-[#528bff] px-4 py-2 rounded-full text-xs font-medium border border-[#0052FF]/20">
                  <ShieldCheck className="h-4 w-4" />
                  Verified on Base
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
