import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export const CTA = () => {
  return (
    <section id="verify" className="relative py-28 lg:py-40 overflow-hidden">
      <div className="absolute inset-0 ticker-bg opacity-60" aria-hidden />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative mx-auto max-w-[1440px] px-6 lg:px-10"
      >
        <div className="eyebrow">Get started</div>
        <h2 className="mt-8 font-display text-balance text-[clamp(3rem,9vw,9rem)]">
          Stop forging. <br />
          Start <span className="font-serif-italic font-normal">trusting.</span>
        </h2>

        <div className="mt-14 flex flex-wrap gap-4 items-center">
          <a href="#" className="btn-ink !px-6 !py-4 text-base">
            Request access <ArrowUpRight className="h-4 w-4" />
          </a>
          <a href="#" className="btn-ghost !px-6 !py-4 text-base">
            Talk to our team
          </a>
        </div>
      </motion.div>
    </section>
  );
};
