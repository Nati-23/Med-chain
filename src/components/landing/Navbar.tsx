import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ROLE_ROUTES } from "@/lib/api";
import { useState } from "react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how" },
  { label: "Roles", href: "#roles" },
  { label: "Security", href: "#security" },
];

export const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 inset-x-0 z-50 px-6 lg:px-10 pt-5"
    >
      <div className="mx-auto max-w-[1440px]">
        <nav className="glass rounded-full flex items-center justify-between pl-5 pr-2 py-2">
          <Link to="/" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
            <span className="font-display text-lg tracking-tight">MedChain</span>
            <span className="font-mono-tight text-foreground/60 ml-1">ET</span>
          </Link>

          <ul className="hidden lg:flex items-center gap-8 text-sm">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="relative text-foreground/80 hover:text-foreground transition-colors after:content-[''] after:absolute after:left-0 after:-bottom-1 after:h-px after:w-0 after:bg-foreground hover:after:w-full after:transition-all after:duration-300"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <Link to={ROLE_ROUTES[user?.role ?? "Doctor"]} className="text-sm px-4 py-2 text-foreground/80 hover:text-foreground transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="text-sm px-4 py-2 text-foreground/80 hover:text-foreground transition-colors">
                  Sign in
                </Link>
              )}
            </div>
            


            <button 
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2.5 rounded-full bg-foreground/5 text-foreground"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="lg:hidden absolute top-full inset-x-6 mt-4 glass rounded-3xl p-8 shadow-2xl"
          >
            <ul className="space-y-6 text-center">
              {links.map((l) => (
                <li key={l.href}>
                  <a 
                    href={l.href} 
                    onClick={() => setMobileOpen(false)}
                    className="text-lg font-display text-foreground/80 hover:text-foreground"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
              <hr className="border-foreground/10" />

            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
