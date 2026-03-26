import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Listen for auth state change — this fires as soon as the session is ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        navigate("/explorer", { replace: true });
      }
    });

    // Also check immediately in case session is already set
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        navigate("/explorer", { replace: true });
      }
    });

    // Hard fallback — if nothing happens in 5s, go back to login
    const fallback = setTimeout(() => {
      subscription.unsubscribe();
      navigate("/login", { replace: true });
    }, 5000);

    return () => {
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500 font-medium">Signing you in…</p>
        <p className="text-xs text-slate-400">Please wait a moment</p>
      </div>
    </div>
  );
}
