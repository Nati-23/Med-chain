import { motion } from "framer-motion";
import { Stethoscope, User, Pill } from "lucide-react";

const roles = [
  {
    icon: Stethoscope,
    name: "Doctor",
    tagline: "Issue with confidence.",
    points: ["Smart drug autocomplete", "Auto-expiring scripts", "Patient history at a glance"],
  },
  {
    icon: User,
    name: "Patient",
    tagline: "Carry trust in your pocket.",
    points: ["Instant QR delivery", "Offline-first wallet", "Share, download, revoke"],
  },
  {
    icon: Pill,
    name: "Pharmacist",
    tagline: "Dispense without doubt.",
    points: ["Camera scan in 1s", "Live valid / used / expired", "One-tap dispense logging"],
  },
];

export const Roles = () => {
  return (
    <section id="roles" className="relative py-28 lg:py-40 bg-secondary/40">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-10">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="eyebrow">Built for everyone</div>
            <h2 className="mt-8 font-display text-[clamp(2.5rem,6.5vw,6rem)]">
              One platform. <span className="font-serif-italic font-normal">Three</span> roles.
            </h2>
          </div>
          <p className="text-foreground/70 max-w-md">
            From the consultation room to the dispensary counter, MedChain replaces
            paper trust with cryptographic proof.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r, i) => (
            <motion.article
              key={r.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -6 }}
              className="glass rounded-3xl p-8 flex flex-col h-full"
            >
              <div className="flex items-center justify-between">
                <div className="h-11 w-11 rounded-2xl bg-foreground text-background flex items-center justify-center">
                  <r.icon className="h-5 w-5" strokeWidth={1.6} />
                </div>
                <span className="font-mono-tight text-foreground/50">0{i + 1}</span>
              </div>
              <h3 className="mt-10 font-display text-3xl">{r.name}</h3>
              <p className="mt-2 font-serif-italic text-2xl text-foreground/70">{r.tagline}</p>
              <ul className="mt-8 space-y-3 text-sm text-foreground/75">
                {r.points.map((p) => (
                  <li key={p} className="flex items-start gap-3">
                    <span className="mt-2 h-1 w-4 bg-foreground/60" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
