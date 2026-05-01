import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { StatusBadge } from "./StatusBadge";
import { Download, Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { Prescription } from "@/lib/api";

export const QRModal = ({
  rx,
  open,
  onOpenChange,
}: {
  rx: Prescription | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) => {
  const [copied, setCopied] = useState(false);
  if (!rx) return null;

  const copy = async () => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const verificationUrl = `${appUrl}/verify?hash=${rx.hash}&cid=${rx.cid}`;
    await navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    toast.success("Verification URL copied");
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const canvas = document.querySelector(`#qr-${rx.id} canvas`) as HTMLCanvasElement;
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

  const share = async () => {
    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const verificationUrl = `${appUrl}/verify?hash=${rx.hash}&cid=${rx.cid}`;
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: "MedChain Prescription", 
          text: `Prescription verification: ${verificationUrl}`
        });
      } catch {
        /* dismissed */
      }
    } else {
      copy();
    }
  };

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const verifyUrl = `${appUrl}/verify?hash=${rx.hash}&cid=${rx.cid}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:max-w-[550px] w-[90%] p-0 overflow-y-auto max-h-[85vh] border border-foreground/15 bg-white text-slate-900 rounded-[2rem] shadow-2xl flex flex-col">
        <DialogHeader className="px-8 pt-8 pb-4 flex flex-col items-center">
          <DialogTitle className="font-display text-3xl tracking-tight text-center">Prescription Details</DialogTitle>
        </DialogHeader>

        <div className="px-8 pb-8 flex flex-col space-y-8">
          {/* 1. QR CODE centered (Focal Point) */}
          <div className="flex justify-center items-center my-5 w-full">
            <div id={`qr-${rx.id}`} className="flex justify-center items-center">
              <QRCodeDisplay value={verifyUrl} />
            </div>
          </div>

          {/* 2. Prescription Details (Vertical Stack) */}
          <div className="flex flex-col space-y-5">
            <div className="flex flex-col border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Prescription Drug</span>
              <span className="text-xl font-bold text-slate-900">{rx.drug || "Unknown Drug"}</span>
            </div>
            
            <div className="flex flex-col border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Patient Name</span>
              <span className="text-lg font-semibold text-slate-800">{rx.patientName || "—"}</span>
            </div>

            <div className="flex flex-col border-b border-slate-100 pb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">Current Status</span>
              <div className="pt-1 flex items-center justify-between">
                <StatusBadge status={rx.status} />
                {rx.txHash && rx.txHash !== "0x..." && (
                  <a 
                    href={`https://sepolia.basescan.org/tx/${rx.txHash}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[10px] font-mono-tight border border-slate-200 rounded-full px-3 py-1 hover:bg-slate-900 hover:text-white transition-colors flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    View on BaseScan
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* 3. Verification Link */}
          <div className="flex flex-col space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2 block">Digital Verification Link</span>
            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <p className="font-mono text-[11px] truncate text-slate-600">{verifyUrl}</p>
              </div>
              <button
                onClick={copy}
                className="shrink-0 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 transition-colors shadow-sm"
                title="Copy Link"
              >
                {copied ? <Check className="h-5 w-5 text-green-600" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* 4. Action Buttons (Vertical Stack) */}
          <div className="flex flex-col gap-3 pt-4">
            <button 
              onClick={share} 
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Share2 className="h-5 w-5" /> Share Prescription
            </button>
            <button 
              onClick={download} 
              className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold py-4 rounded-2xl transition-all active:scale-[0.98]"
            >
              <Download className="h-5 w-5" /> Download QR Code
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
