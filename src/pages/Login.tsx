import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ShieldCheck, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setLoading(true);
    try {
      const { session, redirectTo } = await authApi.login(email, password);
      login(session);
      toast.success(`Welcome back, ${session.user.name}`);
      
      const from = location.state?.from?.pathname || redirectTo;
      navigate(from, { replace: true });
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background grid place-items-center px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[hsl(var(--signal))] to-[hsl(var(--verify))] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="w-full max-w-md glass rounded-3xl p-8 lg:p-10 shadow-[var(--shadow-elevated)] relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-foreground/40 hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-mono-tight">Back to Home</span>
        </Link>

        <div className="flex flex-col items-center text-center pb-8 border-b border-foreground/15">
          <Link to="/" className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6 hover:scale-110 transition-transform">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.6} />
          </Link>
          <h1 className="font-display text-3xl mb-2">MedChain Access</h1>
          <p className="text-foreground/60 text-sm">Sign in to the verifiable network</p>
        </div>

        <form onSubmit={handleLogin} className="pt-8 space-y-5">
          <div>
            <label className="font-mono-tight text-foreground/60 mb-2 block">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@medchain.et"
              className="rx-input"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="font-mono-tight text-foreground/60 mb-2 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rx-input"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-ink w-full justify-center !py-3.5 mt-8 disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating...</>
            ) : (
              "Secure Login"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-foreground/50 font-mono-tight">
          Don't have an account? <Link to="/register" className="text-foreground font-bold hover:underline">Register now</Link>
        </p>


      </div>
    </div>
  );
}
