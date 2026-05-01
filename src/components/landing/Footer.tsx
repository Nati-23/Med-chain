import { ShieldCheck } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t border-foreground/15">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-16 grid grid-cols-2 lg:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
            <span className="font-display text-lg">MedChain</span>
            <span className="font-mono-tight text-foreground/60">ET</span>
          </div>
          <p className="mt-4 text-foreground/70 max-w-sm">
            Blockchain-verified prescriptions for Ethiopia. Built with the
            Federal Ministry of Health in mind.
          </p>
        </div>
        <div>
          <div className="font-mono-tight text-foreground/60">Product</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#how" className="hover:text-foreground/100 text-foreground/80">How it works</a></li>
            <li><a href="#roles" className="hover:text-foreground/100 text-foreground/80">Roles</a></li>
            <li><a href="#security" className="hover:text-foreground/100 text-foreground/80">Security</a></li>
          </ul>
        </div>
        <div>
          <div className="font-mono-tight text-foreground/60">Company</div>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="#" className="hover:text-foreground/100 text-foreground/80">About</a></li>
            <li><a href="#" className="hover:text-foreground/100 text-foreground/80">Contact</a></li>
            <li><a href="#" className="hover:text-foreground/100 text-foreground/80">Privacy</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-foreground/15">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-10 py-6 flex items-center justify-between text-xs text-foreground/60">
          <span>© {new Date().getFullYear()} MedChain Ethiopia</span>
          <span className="font-mono-tight">v0.1 · Addis Ababa</span>
        </div>
      </div>
    </footer>
  );
};
