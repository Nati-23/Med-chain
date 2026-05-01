import { motion } from "framer-motion";
import { Lock, Fingerprint, Network, Eye } from "lucide-react";

const items = [
  { icon: Lock, title: "Immutable ledger", body: "Every script is hashed on-chain. Tampering is mathematically impossible." },
  { icon: Fingerprint, title: "Role-based access", body: "Doctors sign with private keys. Pharmacists verify with cameras. Patients carry proof." },
  { icon: Network, title: "Offline-resilient", body: "QR codes verify locally first, then sync. Built for clinics with patchy connectivity." },
  { icon: Eye, title: "Full audit trail", body: "Every issue, view and dispense is logged. Regulators get read-only oversight." },
];

export const Security = () => {
  return (
    <section id="security" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="eyebrow">Security primitives</div>
        <h2 className="mt-8 font-display text-[clamp(2.5rem,6.5vw,6rem)]">
          Designed for <span className="font-serif-italic font-normal">harm-free</span> dispensing.
        </h2>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-px bg-foreground/15 border border-foreground/15 rounded-3xl overflow-hidden">
          {items.map((it, i) => (
            <motion.div
              key={it.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="bg-background p-10 lg:p-14"
            >
              <it.icon className="h-6 w-6 text-foreground/80" strokeWidth={1.4} />
              <h3 className="mt-8 font-display text-2xl lg:text-3xl">{it.title}</h3>
              <p className="mt-3 text-foreground/70 max-w-md leading-relaxed">{it.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
