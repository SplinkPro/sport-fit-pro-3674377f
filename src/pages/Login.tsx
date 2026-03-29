import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, ShieldCheck, Chrome } from "lucide-react";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [authLoading, setAuthLoading] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) navigate("/explorer", { replace: true });
  }, [user, loading, navigate]);

  // Handle OAuth return token on hard redirect back to /login
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has("__lovable_token")) return;

    let cancelled = false;
    setAuthLoading(true);

    const completeOAuthSignIn = async () => {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (cancelled) return;

        if (session?.user) {
          navigate("/explorer", { replace: true });
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (cancelled) return;

      setAuthLoading(false);
      window.history.replaceState({}, "", window.location.pathname);
      toast({
        title: "Google sign-in did not complete",
        description: "Please try again. If it still hangs, refresh once and retry.",
        variant: "destructive",
      });
    };

    void completeOAuthSignIn();

    return () => {
      cancelled = true;
    };
  }, [navigate, toast]);

  const handleGoogle = async () => {
    setAuthLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: { prompt: "select_account" },
      });

      if (result?.error) {
        toast({ title: "Sign-in failed", description: String(result.error), variant: "destructive" });
        setAuthLoading(false);
        return;
      }

      if (result?.redirected) {
        return;
      }

      navigate("/explorer", { replace: true });
    } catch (err) {
      toast({ title: "Sign-in failed", description: String(err), variant: "destructive" });
      setAuthLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) toast({ title: "Sign-up failed", description: error.message, variant: "destructive" });
      else toast({ title: "Check your email", description: "Confirmation link sent." });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast({ title: "Sign-in failed", description: error.message, variant: "destructive" });
    }
    setAuthLoading(false);
  };

  // Don't block the login page on auth loading — if user is detected, the redirect effect handles it
  if (loading && !user) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading Pratibha…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #1E3A5F 0%, transparent 70%)" }} />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: "radial-gradient(circle, #F97316 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
              style={{ background: "#1E3A5F" }}>
              <Zap className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight" style={{ color: "#1E3A5F" }}>
              Pratibha <span className="font-light text-slate-400">by SPLINK</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1">Athlete Intelligence Platform</p>
          </div>

          {/* Google Sign-In */}
          {!emailMode && (
            <>
              <button
                onClick={handleGoogle}
                disabled={authLoading}
                className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl border-2 border-slate-200 bg-white font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 mb-4"
              >
                <Chrome className="w-5 h-5 text-blue-500" />
                {authLoading ? "Signing in…" : "Continue with Google"}
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-xs text-slate-400 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                onClick={() => setEmailMode(true)}
                className="w-full py-3 rounded-2xl border-2 border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Continue with Email
              </button>
            </>
          )}

          {/* Email Sign-In */}
          {emailMode && (
            <form onSubmit={handleEmail} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#1E3A5F] transition-colors"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#1E3A5F] transition-colors"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
                style={{ background: "#F97316" }}
              >
                {authLoading ? "Please wait…" : isSignUp ? "Create Account" : "Sign In"}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => setEmailMode(false)} className="text-slate-400 hover:text-slate-600">
                  ← Back
                </button>
                <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[#1E3A5F] font-semibold hover:underline">
                  {isSignUp ? "Already have an account?" : "Create account"}
                </button>
              </div>
            </form>
          )}

          {/* Trust badge */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>Zero data access · Enterprise security</span>
          </div>
        </div>

        {/* Back to landing */}
        <div className="text-center mt-5">
          <a href="/" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            ← Back to home
          </a>
        </div>
      </div>
    </div>
  );
}
