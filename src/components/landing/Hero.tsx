import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Animated "rain" of vertical glyphs. Marks fall, fade, and react to the
 * cursor like soft rain hitting glass.
 */
type Drop = {
  id: number;
  x: number;
  startY: number;
  length: number;
  width: number;
  duration: number;
  delay: number;
  opacity: number;
};

const COUNT = 260;
const seedRand = (i: number) => {
  let x = (i * 2654435761) >>> 0;
  x ^= x << 13; x >>>= 0;
  x ^= x >>> 17;
  x ^= x << 5;  x >>>= 0;
  return (x % 10000) / 10000;
};

const buildDrops = (offset = 0): Drop[] =>
  Array.from({ length: COUNT }).map((_, i) => {
    const r1 = seedRand(i + offset);
    const r2 = seedRand(i * 7 + 91 + offset);
    const r3 = seedRand(i * 13 + 17 + offset);
    const isAccent = i % 11 === 0;
    return {
      id: i + offset * COUNT,
      x: r1 * 100,
      startY: -10 - r2 * 25,
      length: isAccent ? 14 + r3 * 10 : 5 + r3 * 5,
      width: 1,
      duration: 2.8 + r2 * 3.5,
      delay: r1 * 3,
      opacity: isAccent ? 0.6 : 0.32 + r3 * 0.28,
    };
  });

const GlyphField = () => {
  const [drops, setDrops] = useState<Drop[]>(() => buildDrops());
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let n = 1;
    const id = setInterval(() => setDrops(buildDrops(n++)), 9000);
    return () => clearInterval(id);
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setMouse(null)}
      className="absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {drops.map((d) => {
        let boost = 0;
        if (mouse) {
          const dx = mouse.x - d.x;
          const dist = Math.abs(dx);
          boost = Math.max(0, 1 - dist / 8);
        }
        return (
          <motion.span
            key={d.id}
            initial={{ y: `${d.startY}vh`, opacity: 0 }}
            animate={{
              y: ["0vh", "120vh"],
              opacity: [0, d.opacity + boost * 0.5, d.opacity + boost * 0.3, 0],
            }}
            transition={{
              duration: d.duration,
              delay: d.delay,
              repeat: Infinity,
              ease: "linear",
              times: [0, 0.15, 0.7, 1],
            }}
            style={{
              left: `${d.x}%`,
              height: `${d.length}px`,
              width: `${d.width}px`,
              borderRadius: "1px",
              background: `hsl(var(--ink) / ${Math.min(1, d.opacity + boost * 0.6)})`,
              boxShadow: boost > 0.2 ? `0 0 10px hsl(var(--signal) / ${boost * 0.8})` : undefined,
            }}
            className="absolute top-0"
          />
        );
      })}

      {mouse && (
        <motion.div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: `${mouse.x}%`,
            top: `${mouse.y}%`,
            width: 240,
            height: 240,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, hsl(var(--signal) / 0.10), transparent 65%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </div>
  );
};

export const Hero = () => {
  return (
    <section className="relative pt-32 lg:pt-36 pb-24 overflow-hidden">
      <GlyphField />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-foreground/10" />

      <div className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="eyebrow"
        >
          Blockchain prescriptions for Ethiopia
        </motion.div>

        <h1 className="mt-10 font-display text-foreground text-balance text-[clamp(3.5rem,11vw,11rem)]">
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            Trust every
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="block"
          >
            <span className="font-serif-italic font-normal pr-4">prescription</span>
          </motion.span>
        </h1>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-end">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="lg:col-span-6 text-lg lg:text-xl text-foreground/75 leading-relaxed max-w-xl"
          >
            Your toolkit to stop forging and start trusting. Securely issue, verify,
            and dispense every prescription on an immutable medical ledger —
            secured by blockchain, verified in seconds.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="lg:col-span-6 flex flex-wrap items-center gap-3 lg:justify-end"
          >
            <a href="/login" className="btn-ink px-10">
              Start verifying <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
