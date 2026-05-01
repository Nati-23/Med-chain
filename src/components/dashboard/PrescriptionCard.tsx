import { motion } from "framer-motion";
import { QrCode, Download, ExternalLink, Pill, Calendar } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { QRCodeDisplay } from "./QRCodeDisplay";
import type { Prescription } from "@/lib/api";
import { toast } from "sonner";

interface Props {
  rx: Prescription;
  index: number;
  onViewDetails?: (rx: Prescription) => void;
}

export const PrescriptionCard = ({ rx, index, onViewDetails }: Props) => {
  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const verifyUrl = `${appUrl}/verify?hash=${rx.hash}&cid=${rx.cid}`;

  const download = (e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = document.querySelector(`#qr-card-${rx.id} canvas`) as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Failed to generate image");
      return;
    }
    
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `Prescription-QR-${rx.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast.success("QR downloaded as PNG");
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group glass rounded-[2rem] p-6 lg:p-8 flex flex-col md:flex-row gap-8 hover:shadow-[var(--shadow-elevated)] transition-all border border-foreground/5"
    >
      {/* Left Side: Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center shrink-0">
              <Pill className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-mono-tight text-[10px] text-foreground/40 uppercase tracking-widest">{rx.id}</span>
                {rx.txHash && rx.txHash !== "0x..." && (
                  <a 
                    href={`https://sepolia.basescan.org/tx/${rx.txHash}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] border border-foreground/15 rounded-full px-2 py-0.5 hover:bg-foreground text-foreground hover:text-background flex items-center gap-1 transition-all"
                    title="View on Base Testnet Explorer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="w-1 h-1 rounded-full bg-green-500" />
                    On-chain
                  </a>
                )}
              </div>
              <StatusBadge status={rx.status} />
            </div>
          </div>

          <h3 className="font-display text-3xl text-foreground mb-2 leading-tight">{rx.drug}</h3>
          <p className="text-foreground/70 font-medium mb-4">{rx.dosage}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">Patient</span>
              <p className="text-sm font-semibold truncate">{rx.patientName}</p>
              <p className="text-[11px] font-mono-tight text-foreground/50">{rx.patientId}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/30">Expires</span>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-3.5 w-3.5 text-foreground/40" />
                {new Date(rx.expiresAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-8">
          <button
            onClick={() => onViewDetails?.(rx)}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-3 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <ExternalLink className="h-4 w-4" /> View Full Details
          </button>
          <button
            onClick={download}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-foreground/15 px-4 py-3 text-sm font-bold hover:bg-foreground/5 transition-colors"
            title="Download QR"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Right Side: QR Code */}
      <div className="shrink-0 flex flex-col items-center gap-4">
        <div id={`qr-card-${rx.id}`} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex items-center justify-center">
          <QRCodeDisplay value={verifyUrl} className="!p-0 !bg-transparent !shadow-none !border-none" />
        </div>
        <div className="flex items-center gap-2 text-foreground/40">
          <QrCode className="h-4 w-4" />
          <span className="text-[10px] font-mono-tight uppercase tracking-widest">Instant Verification</span>
        </div>
      </div>
    </motion.div>
  );
};
