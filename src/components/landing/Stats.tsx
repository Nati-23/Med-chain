import { motion } from "framer-motion";

const stats = [
  { value: "0 days", label: "Lost to forgery" },
  { value: "98%", label: "Faster verification" },
  { value: "300%", label: "Audit coverage" },
  { value: "6x", label: "Safer dispensing" },
  { value: "24/7", label: "Ledger uptime" },
  { value: "<1s", label: "Confirm time" },
];

const Item = ({ value, label }: { value: string; label: string }) => (
  <div className="flex items-baseline gap-6 px-10 lg:px-16 shrink-0">
    <span className="font-display text-5xl lg:text-7xl tracking-tight whitespace-nowrap">
      {value}
    </span>
    <span className="eyebrow whitespace-nowrap">{label}</span>
  </div>
);

export const Stats = () => {
  // Duplicate the list so the translate -50% loop is seamless
  const loop = [...stats, ...stats];

  return (
    <section
      aria-label="Key metrics"
      className="border-y border-foreground/15 overflow-hidden relative"
    >
      {/* Soft fade edges so items appear to slide in from the left and out to the right */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 lg:w-40 z-10 bg-gradient-to-r from-background to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 lg:w-40 z-10 bg-gradient-to-l from-background to-transparent" />

      <motion.div
        className="flex py-12 lg:py-16 will-change-transform"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 38, ease: "linear", repeat: Infinity }}
      >
        {loop.map((s, i) => (
          <div key={i} className="flex items-center">
            <Item value={s.value} label={s.label} />
            {/* Vertical divider between items */}
            <span className="h-12 w-px bg-foreground/15" />
          </div>
        ))}
      </motion.div>
    </section>
  );
};
