import { motion } from "framer-motion";
import { FileSignature, QrCode, PackageCheck } from "lucide-react";

const steps = [
  {
    n: "01",
    icon: FileSignature,
    title: "Doctor issues",
    body: "A licensed doctor writes a prescription. It's hashed and committed to the chain in under a second.",
  },
  {
    n: "02",
    icon: QrCode,
    title: "Patient receives",
    body: "The patient gets a tamper-proof QR code on their phone — works offline, expires automatically.",
  },
  {
    n: "03",
    icon: PackageCheck,
    title: "Pharmacist dispenses",
    body: "Scan to verify in real time. The ledger marks it as dispensed — no double-fills, ever.",
  },
];

export const HowItWorks = () => {
  return (
    <section id="how" className="relative py-28 lg:py-40">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="eyebrow">How it works</div>

        <h2 className="mt-10 font-display text-balance text-[clamp(2.75rem,7.5vw,7rem)]">
          Three steps.<br />
          One <span className="font-serif-italic font-normal">chain</span> of trust.
        </h2>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-px bg-foreground/15 border border-foreground/15 rounded-3xl overflow-hidden">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.7, delay: i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="bg-background p-8 lg:p-10 group hover:bg-secondary/60 transition-colors duration-500"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono-tight text-foreground/60">{s.n}</span>
                <s.icon className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              </div>
              <h3 className="mt-12 font-display text-3xl lg:text-4xl">{s.title}</h3>
              <p className="mt-4 text-foreground/70 leading-relaxed max-w-xs">{s.body}</p>

              <div className="mt-10 h-px w-full bg-foreground/15 relative overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  whileInView={{ x: "0%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 0.4 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 bg-foreground"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
