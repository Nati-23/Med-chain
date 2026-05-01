import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Stethoscope, User, ScanLine, ShieldAlert, ArrowUpRight, Bell, Search, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ReactNode, useState } from "react";

const nav = [
  { to: "/doctor", label: "Doctor", icon: Stethoscope, role: "Doctor" },
  { to: "/patient", label: "Patient", icon: User, role: "Patient" },
  { to: "/pharmacist", label: "Pharmacist", icon: ScanLine, role: "Pharmacist" },
  { to: "/admin", label: "Admin", icon: ShieldAlert, role: "Admin" },
];

export const DashboardLayout = ({
  children,
  title,
  eyebrow,
}: {
  children: ReactNode;
  title: string;
  eyebrow: string;
}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hide nav items if user shouldn't see them
  const activeNav = nav.filter(n => user?.role === "Admin" || n.role === user?.role);

  const NavItem = ({ n, mobile = false }: { n: typeof nav[0], mobile?: boolean }) => (
    <NavLink
      to={n.to}
      onClick={() => mobile && setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
          isActive
            ? "bg-foreground text-background shadow-lg shadow-foreground/10"
            : "text-foreground/75 hover:bg-foreground/5 hover:text-foreground"
        }`
      }
    >
      <span className="flex items-center gap-3">
        <n.icon className={`h-4 w-4 ${mobile ? 'h-5 w-5' : ''}`} strokeWidth={1.6} />
        <span className={mobile ? 'text-base font-medium' : ''}>{n.label}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-foreground/15 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
          <span className="font-display text-lg">MedChain ET</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden fixed inset-x-0 top-[73px] bottom-0 z-40 bg-background px-6 py-8 overflow-y-auto"
          >
            <div className="font-mono-tight text-foreground/50 mb-4 px-2">Workspaces</div>
            <ul className="space-y-2">
              {activeNav.map((n) => (
                <li key={n.to}>
                  <NavItem n={n} mobile />
                </li>
              ))}
            </ul>

            <div className="mt-12 p-6 glass rounded-[2rem] flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-foreground text-background grid place-items-center text-xl font-semibold mb-4">
                {user?.avatarInitials}
              </div>
              <div className="text-lg font-display">{user?.name}</div>
              <div className="text-sm text-foreground/50 mb-6">{user?.facility || user?.role}</div>
              <button 
                onClick={() => { logout(); navigate("/login"); }}
                className="w-full flex items-center justify-center gap-2 bg-destructive/10 text-destructive py-4 rounded-2xl font-bold"
              >
                <LogOut className="h-5 w-5" /> Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-foreground/15 sticky top-0 h-screen">
        <Link to="/" className="px-6 py-6 flex items-center gap-2 border-b border-foreground/15 hover:bg-foreground/5 transition-colors">
          <ShieldCheck className="h-5 w-5" strokeWidth={1.6} />
          <span className="font-display text-lg">MedChain</span>
          <span className="font-mono-tight text-foreground/60">ET</span>
        </Link>

        <div className="px-4 py-6 flex-1">
          <div className="px-2 mb-3 font-mono-tight text-foreground/50">Workspaces</div>
          <ul className="space-y-1">
            {activeNav.map((n) => (
              <li key={n.to}>
                <NavItem n={n} />
              </li>
            ))}
          </ul>

          <div className="mt-10 px-2 mb-3 font-mono-tight text-foreground/50">Network</div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--verify))] animate-pulse" />
              <span className="text-foreground/70">Ledger online</span>
            </div>
            <div className="mt-3 font-mono-tight text-foreground/60">Block #481,209</div>
            <div className="mt-1 text-xs text-foreground/50">Avg. confirm 0.8s</div>
          </div>
        </div>

        <div className="p-4 border-t border-foreground/15">
          <NavLink to="/" className="flex items-center gap-2 text-xs text-foreground/60 hover:text-foreground transition-colors group">
            <span className="group-hover:-translate-x-1 transition-transform">←</span> Back to landing
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 min-w-0">
        <header className="hidden lg:block sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-foreground/15">
          <div className="px-10 py-4 flex items-center gap-4">
            <div className="flex items-center gap-2 flex-1 max-w-md rounded-full border border-foreground/15 px-4 py-2 bg-background">
              <Search className="h-4 w-4 text-foreground/60" />
              <input
                placeholder="Search prescriptions, patients, IDs…"
                className="bg-transparent text-sm outline-none flex-1 placeholder:text-foreground/50"
              />
              <span className="font-mono-tight text-foreground/40">⌘K</span>
            </div>
            <button className="rounded-full border border-foreground/15 p-2 hover:bg-foreground/5 transition-colors" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-foreground/15">
              <div className="text-right">
                <div className="text-sm font-medium leading-tight">{user?.name}</div>
                <div className="font-mono-tight text-foreground/50">{user?.facility || user?.role}</div>
              </div>
              <div className="h-9 w-9 rounded-full bg-foreground text-background grid place-items-center text-xs font-semibold">
                {user?.avatarInitials}
              </div>
              <button 
                onClick={() => { logout(); navigate("/login"); }} 
                className="ml-2 rounded-full border border-foreground/15 p-2 hover:bg-destructive/10 hover:text-destructive transition-colors" 
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </header>

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="px-6 lg:px-10 py-10"
        >
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-6 font-display text-[clamp(2.25rem,5vw,4rem)] leading-[1.1] tracking-tight">{title}</h1>
          <div className="mt-12">{children}</div>
        </motion.main>
      </div>
    </div>
  );
};
