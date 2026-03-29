// Widen the OAuthProvider type so the auto-generated index.ts compiles
// even when it includes providers not yet in the installed package.
declare module "@lovable.dev/cloud-auth-js" {
  export function createLovableAuth(config?: any): {
    signInWithOAuth: (
      provider: string,
      opts?: { redirect_uri?: string; extraParams?: Record<string, string> }
    ) => Promise<any>;
  };
}
