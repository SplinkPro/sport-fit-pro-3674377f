import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle both Lovable Cloud OAuth (redirects to origin) and direct callback
    const handleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/explorer", { replace: true });
      } else {
        // Wait briefly for session to be established from URL hash
        setTimeout(async () => {
          const { data: { session: s2 } } = await supabase.auth.getSession();
          navigate(s2 ? "/explorer" : "/login", { replace: true });
        }, 1000);
      }
    };
    handleSession();
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
