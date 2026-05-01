import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldPlus, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { authApi, Role } from "@/lib/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("Patient");
  const [license, setLicense] = useState("");
  const [facility, setFacility] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      toast.error("Please fill in all required fields");
      return;
    }

    if ((role === "Doctor" || role === "Pharmacist") && !license) {
      toast.error(`${role} registration requires a license number`);
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.register({
        name,
        email,
        password,
        role,
        license: role === "Patient" ? undefined : license,
        facility: role === "Patient" ? undefined : facility,
        walletAddress: walletAddress || undefined,
      });

      if (response.token) {
        toast.success("Account created successfully!");
        // If it's a patient, they might be logged in automatically by the backend
        // But for simplicity in this flow, let's just redirect to login
      } else {
        toast.success("Registration submitted! Pending admin approval.");
      }
      
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12 px-4 relative overflow-hidden flex items-center justify-center">
      {/* Background Decor */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[hsl(var(--signal))] to-[hsl(var(--verify))] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
      </div>

      <div className="w-full max-w-lg glass rounded-3xl p-8 lg:p-10 shadow-[var(--shadow-elevated)] relative z-10">
        <div className="flex flex-col items-center text-center pb-8 border-b border-foreground/15">
          <div className="w-full flex justify-between items-center mb-4">
            <Link to="/" className="text-foreground/50 hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-mono-tight">Back to Home</span>
            </Link>
            <Link to="/login" className="text-foreground/50 hover:text-foreground flex items-center gap-1 transition-colors">
              <span className="text-xs font-mono-tight">Back to Login</span>
            </Link>
          </div>
          <Link to="/" className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center mb-6 hover:scale-110 transition-transform">
            <ShieldPlus className="h-6 w-6" strokeWidth={1.6} />
          </Link>
          <h1 className="font-display text-3xl mb-2">Join MedChain</h1>
          <p className="text-foreground/60 text-sm">Create your verifiable healthcare identity</p>
        </div>

        <form onSubmit={handleRegister} className="pt-8 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="font-mono-tight text-foreground/60 mb-2 block">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="rx-input"
                required
              />
            </div>
            
            <div className="col-span-2 sm:col-span-1">
              <label className="font-mono-tight text-foreground/60 mb-2 block">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="rx-input"
                required
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="font-mono-tight text-foreground/60 mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rx-input"
                required
              />
            </div>

            <div className="col-span-2">
              <label className="font-mono-tight text-foreground/60 mb-2 block">User Role</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["Patient", "Doctor", "Pharmacist", "Admin"] as Role[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl border font-mono-tight text-[10px] uppercase tracking-wider transition-all ${
                      role === r 
                        ? "bg-foreground text-background border-foreground" 
                        : "bg-transparent border-foreground/15 text-foreground/60 hover:border-foreground/30"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {role !== "Patient" && (
              <>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-mono-tight text-foreground/60 mb-2 block">License Number</label>
                  <input
                    type="text"
                    value={license}
                    onChange={(e) => setLicense(e.target.value)}
                    placeholder="LIC-123456"
                    className="rx-input"
                    required={role !== "Admin"}
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="font-mono-tight text-foreground/60 mb-2 block">Facility / Hospital</label>
                  <input
                    type="text"
                    value={facility}
                    onChange={(e) => setFacility(e.target.value)}
                    placeholder="Black Lion Hospital"
                    className="rx-input"
                  />
                </div>
              </>
            )}

            <div className="col-span-2">
              <label className="font-mono-tight text-foreground/60 mb-2 block">Wallet Address (Optional)</label>
              <input
                type="text"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="rx-input font-mono text-[10px]"
              />
              <p className="text-[10px] text-foreground/40 mt-1 font-mono-tight">For on-chain identity and verification</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-ink w-full justify-center !py-3.5 mt-8 disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</>
            ) : (
              "Complete Registration"
            )}
          </button>
        </form>

        <p className="mt-8 pt-6 border-t border-foreground/15 text-xs text-foreground/50 text-center font-mono-tight">
          Already have an account? <Link to="/login" className="text-foreground font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
