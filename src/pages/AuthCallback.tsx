import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    let done = false;
    const finish = (target: string) => {
      if (done) return;
      done = true;
      navigate(target, { replace: true });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
        finish("/explorer");
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish("/explorer");
    });

    // Soft hint after 4s, hard fallback at 8s — gives slow networks a chance.
    const stallTimer = setTimeout(() => setStalled(true), 4000);
    const fallback = setTimeout(() => finish("/login"), 8000);

    return () => {
      clearTimeout(stallTimer);
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-muted-foreground font-medium">Signing you in…</p>
        <p className="text-xs text-muted-foreground/70">
          {stalled ? "Taking longer than expected — almost there…" : "Please wait a moment"}
        </p>
      </div>
    </div>
  );
}
